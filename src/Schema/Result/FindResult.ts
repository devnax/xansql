import Schema from "..";
import { ForeignInfo } from "../../type";
import { isNumber, isObject } from "../../utils";
import BuildLimit from "../Query/BuildLimit";
import BuildOrderby from "../Query/BuildOrderby";
import BuildSelect, { BuildSelectJoinInfo } from "../Query/BuildSelect";
import BuildWhere from "../Query/BuildWhere";
import { FindArgs } from "../type";
import WhereArgs from "./WhereArgs";

type Meta = {
   parent_table: string,
   in: {
      column: string,
      values: number[]
   }
}

class FindResult {
   private model: Schema
   constructor(model: Schema) {
      this.model = model
   }

   async result(args: FindArgs, meta?: Meta) {
      const res = await this.excute(args, meta)
      return res
   }

   private async excute(args: FindArgs, meta?: Meta) {
      const model = this.model
      const { select, where, limit, orderBy } = args
      const columns: string[] = []
      const relationColumns: string[] = []

      let relationArgs: { [column: string]: { args: FindArgs, foreign: ForeignInfo } } = {}

      for (let column in select) {
         const xanv = model.schema[column]
         const foreign = model.getForeign(column)
         if (!xanv && !foreign) {
            throw new Error("Invalid column in select clause: " + column)
         };

         const value: any = select[column]

         if (foreign) {
            const FModel = model.xansql.getSchema(foreign.table)
            let col = `${model.table}.${foreign.relation.target}`
            if (!columns.includes(col) && !relationColumns.includes(col)) {
               relationColumns.push(col)
            }

            const fargs = {
               select: isObject(value) ? value.select : {},
               where: isObject(value) && value.where ? value.where : {},
               limit: isObject(value) && value.limit ? value.limit : {},
               orderBy: isObject(value) && value.orderBy ? value.orderBy : {},
            }

            if (value === true || (isObject(value) && Object.keys(value).length === 0)) {
               for (let rcol in FModel.schema) {
                  const rxanv = FModel.schema[rcol]
                  const rforeign = FModel.getForeign(rcol)
                  if (!rxanv && rforeign) continue;
                  fargs.select[rcol] = true
               }
            }
            relationArgs[column] = {
               args: fargs,
               foreign
            }
         } else {
            if (value === false) continue

            if (value === true) {
               columns.push(`${model.table}.${column}`)
            } else {
               throw new Error("Invalid select value for column " + column)
            }
         }
      }

      if (meta) {
         let col = `${model.table}.${meta.in.column}`
         if (!columns.includes(col) && !relationColumns.includes(col)) {
            relationColumns.push(col)
         }
      }

      const Where = new WhereArgs(model, where || {})
      let where_sql = Where.sql
      if (meta) {
         let insql = `${meta.in.column} IN (${meta.in.values.join(",")})`
         where_sql += where_sql ? ` AND ${insql}` : `WHERE ${insql}`
      }

      let cols = [...columns, ...relationColumns]
      let select_sql = cols.length ? cols.join(", ") : "*"
      let sql = `SELECT ${select_sql} FROM ${model.table} ${where_sql}`

      const { result } = await model.excute(sql)
      if (result.length) {
         for (let rel_args in relationArgs) {
            const { args, foreign } = relationArgs[rel_args]
            const FModel = model.xansql.getSchema(foreign.table)
            let ids: number[] = result.map((r: any) => r[foreign.relation.target]);

            if (meta && meta.parent_table === foreign.table) {
               // throw new Error("Circular reference detected in relation " + rel_args);
            }
            const findResult = new FindResult(FModel)
            const fres: any = await findResult.result(args, {
               parent_table: model.table,
               in: {
                  column: foreign.relation.main,
                  values: Array.from(new Set(ids))
               }
            })

            for (let row of result) {
               if (foreign.type === 'hasMany') {
                  row[rel_args] = fres.filter((fr: any) => {
                     let is = fr[foreign.relation.main] === row[foreign.relation.target]
                     if (is) {
                        delete fr[foreign.relation.main]
                     }
                     return is
                  })
               } else {
                  row[rel_args] = fres.find((fr: any) => {
                     let is = fr[foreign.relation.main] === row[foreign.relation.target]
                     if (is && relationColumns.includes(`${model.table}.${foreign.relation.target}`)) {
                        delete fr[foreign.relation.main]
                     }
                     return is
                  }) || null
               }

               // if (row[rel_args] && relationColumns.includes(`${model.table}.${foreign.relation.target}`)) {
               //    delete row[foreign.relation.target]
               // }
            }
         }
      }

      return result

   }
}

export default FindResult;