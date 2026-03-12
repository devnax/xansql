import Model from "../..";
import { isObject } from "../../../utils";
import { chunkArray } from "../../../utils/chunker";
import XqlRelationMany from "../../../xt/fields/RelationMany";
import XqlRelationOne from "../../../xt/fields/RelationOne";
import { FindArgs } from "../../types";
import BuildAggregateArgs from "../AggregateArgs";
import BuildLimitArgs from "../LimitArgs";
import BuildOrderByArgs from "../OrderByArgs";
import BuildSelectArgs from "../SelectArgs";
import BuildWhereArgs from "../WhereArgs";

type SubQueryInfo = {
   column: string,
   ins: number[]
}

class BuildFindArgs<A extends FindArgs<any> = any> {
   constructor(private args: A, private model: Model<any>, private subQueryInfo?: SubQueryInfo) {
   }

   async results() {
      const args = this.args
      const subQueryInfo = this.subQueryInfo
      const model = this.model
      const xansql = model.xansql
      const schema = model.schema()
      const wargs = new BuildWhereArgs(args.where || {}, model)
      const sargs = new BuildSelectArgs((args as any)?.select! || {}, model)
      const largs = new BuildLimitArgs(args.limit || {} as any, model)
      const oargs = new BuildOrderByArgs(args.orderBy || {}, model)
      const distinct = args.distinct || []

      if (subQueryInfo) {
         if (!sargs.columns.includes(subQueryInfo.column)) {
            sargs.columns.push(subQueryInfo.column)
         }
         wargs.parts.push(`${model.alias}.${subQueryInfo.column} IN (${subQueryInfo.ins.join(",")})`)
         if (distinct.length && !distinct.includes(subQueryInfo.column)) {
            distinct.push(subQueryInfo.column)
         }
      }

      let sql = ""

      if (!distinct.length) {
         sql = `
            SELECT ${sargs.sql}
            FROM ${model.table} as ${model.alias}
            ${wargs.sql} 
            ${oargs.sql} 
            ${largs.sql}
         `
         if (subQueryInfo && largs.sql) {
            const orderBySql = oargs.sql ? oargs.sql : `ORDER BY ${model.alias}.${model.IDColumn}`
            sql = `
            SELECT ${sargs.columns.join(", ")}
            FROM (
                SELECT
                   ${sargs.sql},
                    ROW_NUMBER() OVER (
                        PARTITION BY ${model.alias}.${subQueryInfo.column}
                        ${orderBySql}
                    ) AS rn
                FROM ${model.table} ${model.alias}
                ${wargs.sql}
            ) AS ${model.alias}
            WHERE rn > ${largs.skip} AND rn <= ${largs.take + largs.skip}
         `
         }
      } else {
         const distinctCols = distinct.map(c => `${model.alias}.${c}`).join(", ");
         const orderBySql = oargs.sql ? oargs.sql : `ORDER BY ${model.alias}.${model.IDColumn}`

         sql = `
             SELECT ${sargs.sql}
             FROM (
               SELECT
                 ${sargs.sql},
                 ROW_NUMBER() OVER (
                   PARTITION BY ${distinctCols}
                   ${orderBySql}
                 ) AS distinct_rn
               FROM ${model.table} ${model.alias}
               ${wargs.sql}
             ) ${model.alias}
             WHERE distinct_rn = 1
            ${orderBySql}
            ${!subQueryInfo && largs.sql ? largs.sql : ""}
         `;

         if (subQueryInfo && largs.sql) {
            const orderBySql = oargs.sql ? oargs.sql : `ORDER BY ${model.alias}.${model.IDColumn} ASC`;
            sql = `
             SELECT  ${sargs.sql}
             FROM (
               SELECT
                  ${sargs.sql},
                 ROW_NUMBER() OVER (
                   PARTITION BY ${model.alias}.${subQueryInfo.column}
                   ${orderBySql}
                 ) AS rn
               FROM (
                 ${sql}
               ) ${model.alias}
             ) ${model.alias}
             WHERE rn > ${largs.skip} AND rn <= ${largs.take + largs.skip}
             ${orderBySql}
           `;
         }
      }

      sql = sql.replace(/\s+/gi, " ")

      // execute model
      const execute = await model.execute(sql, args.debug)
      const results = execute.results
      const rowIds = []
      const rowIndexes: { [id: number]: number } = {}
      const relIds: {
         [column: string]: number[]
      } = {}
      const relIndexes: {
         [column: string]: {
            [id: number]: number
         }
      } = {}
      const relcols = Object.keys(sargs.relations)

      for (let i = 0; i < results.length; i++) {
         const row = results[i]
         rowIds.push(row[model.IDColumn])
         rowIndexes[row[model.IDColumn]] = i

         for (let col in row) {
            const field: any = schema[col]
            if (!field.isRelation) {
               row[col] = (field as any).value.fromSql(row[col])
            }

            if (relcols.length && relcols.includes(col)) {
               if (!relIds[col]) relIds[col] = []
               if (!relIndexes[col]) relIndexes[col] = {}

               const rinfo = field.relationInfo
               const id = row[rinfo.self.relation]
               if (id) {
                  relIds[col].push(id)
                  relIndexes[col][id] = i
               }
            }
         }

         // if aggregate exists then set aggregate value 0
         if (args.aggregate) {
            row.aggregate = row.aggregate ?? {}
            for (let rel_col in args.aggregate) {
               const agargs = args.aggregate[rel_col]
               row.aggregate[rel_col] = row.aggregate[rel_col] ?? {}
               for (let col in agargs) {
                  const agval = agargs[col]
                  for (let func in agval) {
                     row.aggregate[rel_col][`${func}_${col}`] = 0
                  }
               }
            }
         }
      }

      if (results.length && Object.keys(sargs.relations).length) {

         // aggregate
         if (args.aggregate) {
            for (let col in args.aggregate) {
               const field = schema[col] as any
               const rinfo = field.relationInfo
               const RModel = xansql.model(field.model)
               const agselect = args.aggregate[col]

               if (!agselect || !Object.keys(agselect).length) continue
               const agargs = new BuildAggregateArgs({
                  select: agselect,
                  groupBy: [rinfo.target.column],
                  where: {
                     [rinfo.target.column]: {
                        [rinfo.self.relation]: {
                           in: rowIds
                        }
                     }
                  },
                  debug: args.debug
               }, RModel)

               const agresults = await agargs.results()
               if (agresults.length) {
                  for (let { chunk } of chunkArray(agresults)) {
                     for (let ares of chunk) {
                        const id = ares[rinfo.target.relation]
                        const index = rowIndexes[id]
                        delete ares[rinfo.target.column]
                        if (!(results as any)[index]["aggregate"]) {
                           (results as any)[index]["aggregate"] = {}
                        }
                        (results as any)[index]["aggregate"][col] = ares
                     }
                  }
               }
            }
         }

         for (let col in sargs.relations) {

            const field = schema[col] as XqlRelationMany<any> | XqlRelationOne<any>
            const isMany = field.type === 'relation-many'
            const rinfo = field.relationInfo
            const rel_column = rinfo.target.relation
            const in_ids: number[] = isMany ? rowIds : relIds[col]
            // const indexes: { [id: number]: number } = {}
            // for (let i = 0; i < results.length; i++) {
            //    const row = results[i]
            //    const id = row[rinfo.self.relation]
            //    if (id) {
            //       indexes[id] = i
            //       in_ids.push(id)
            //    }
            // }

            if (!in_ids.length) continue
            const RModel = xansql.model(field.model)
            const rargs = sargs.relations[col]
            rargs.debug = args.debug
            const f = new BuildFindArgs(rargs as any, RModel, {
               column: rel_column,
               ins: in_ids
            })
            const rel_results = await f.results()

            if (rel_results.length) {
               for (let { chunk } of chunkArray(rel_results)) {
                  for (let rres of chunk) {
                     if (isMany) {
                        const id = rres[rinfo.target.relation]
                        const index = rowIndexes[id]
                        if (!results[index][rinfo.self.column]) {
                           results[index][col] = []
                        }
                        results[index][rinfo.self.column].push(rres)
                        delete rres[rinfo.target.column]
                     } else {
                        const id = rres[rinfo.target.relation]
                        const index = relIndexes[col][id]
                        results[index][rinfo.self.column] = rres
                     }
                  }
               }
            }
         }
      }

      return results
   }
}

export default BuildFindArgs