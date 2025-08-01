import youid from "youid";
import Model from ".";
import xansql from "..";
import Schema, { id } from "../Schema";
import Column from "../Schema/core/Column";
import IDField from "../Schema/core/IDField";
import Relation from "../Schema/core/Relation";
import { formatValue, isArray, isObject } from "../utils";
import RelationArgs from "./RelationArgs";
import { BuildResult, CountArgs, CreateArgs, CreateArgsData, DeleteArgs, FindArgs, GetRelationType, ReturnCount, SelectType, UpdateArgs, UpdateArgsData, WhereArgs, WhereSubCondition } from "./type";


abstract class ModelBase {
   xansql: xansql;
   table: string = "";
   alias: string = "";
   schema: Schema = new Schema({ id: id() });
   private _idField: string = ''

   constructor(xansql: xansql) {
      this.xansql = xansql
   }



   idField() {
      if (this._idField) return this._idField
      const schema = this.schema.get()
      for (let column in schema) {
         if (schema[column] instanceof IDField) {
            this._idField = column
            return column
         }
      }
   }

   getRelation(column: string) {
      const schema = this.schema.get()
      const relation_column = schema[column]
      if (!(relation_column instanceof Relation)) throw new Error(`Invalid relation column ${this.table}.${column}`)

      if (!relation_column.table) {
         const reference: any = schema[relation_column.column]; // relation_column.column-> user_id
         let foregin_table = reference.constraints.references.table // users
         let foregin_column = reference.constraints.references.column // id
         if (!foregin_table) throw new Error(`Invalid relation column ${this.table}.${column}`)
         if (!foregin_column) throw new Error(`Invalid relation column ${this.table}.${column}`)

         const foreginModel = this.xansql.getModel(foregin_table)
         if (!foreginModel) throw new Error(`Invalid table name ${foregin_table}`)
         const foreginSchema = foreginModel.schema.get()
         let _for_col = ""
         for (let fcolumn in foreginSchema) {
            if (foreginSchema[fcolumn] instanceof Relation) {
               const relation = foreginSchema[fcolumn] as Relation
               if (relation.table === this.table && relation.column === relation_column.column) {
                  _for_col = fcolumn
                  break
               }
            }
         }

         let foreginRelation: any = foreginModel.getRelation(_for_col)

         return {
            single: true,
            main: foreginRelation.foregin,
            foregin: foreginRelation.main,
         }
      } else {
         const foreginModel = this.xansql.getModel((relation_column as any).table)
         if (!foreginModel) throw new Error(`Invalid table name ${relation_column.table}`)
         const foreginSchema = foreginModel.schema.get()
         const foreginColumn = foreginSchema[relation_column.column]

         if (!(foreginColumn instanceof Column)) throw new Error(`Invalid relation column ${relation_column.table}.${relation_column.column}`)
         const references = foreginColumn.constraints.references
         if (!references) throw new Error(`Invalid relation column ${relation_column.table}.${relation_column.column}`)
         if (references.table !== this.table) throw new Error(`Invalid relation column ${relation_column.table}.${relation_column.column}`);

         let foriginField = ''
         for (let column in foreginSchema) {
            if (foreginSchema[column] instanceof Relation) {
               const relation = foreginSchema[column] as Relation
               if (relation.column === relation_column.column) {
                  foriginField = column
                  break
               }
            }
         }

         return {
            single: false,
            main: {
               table: references.table,
               column: references.column,
               field: column,
               alias: this.alias,
            },
            foregin: {
               table: relation_column.table as string,
               column: relation_column.column,
               field: foriginField,
               alias: foreginModel.alias
            }
         }
      }
   }

   private buildWhereConditions(column: string, conditions: WhereSubCondition, alias: string): string {
      const subConditions = Object.keys(conditions)
         .map((subKey) => {
            const subValue = (conditions as any)[subKey];
            if (subValue === null) return `${alias}.${column} IS NULL`;
            if (subValue === undefined) return `${alias}.${column} IS NOT NULL`;
            if (subValue === "") return `${alias}.${column} = ''`;
            if (subValue === false) return `${alias}.${column} = FALSE`;
            if (subValue === true) return `${alias}.${column} = TRUE`;
            if (isObject(subValue)) {
               throw new Error(`Invalid value ${subValue} for ${alias}.${column}`);
            }
            switch (subKey) {
               case 'equals':
                  return `${alias}.${column} = ${formatValue(subValue)}`;
               case 'not':
                  return `${alias}.${column} != ${formatValue(subValue)}`;
               case 'lt':
                  return `${alias}.${column} < ${formatValue(subValue)}`;
               case 'lte':
                  return `${alias}.${column} <= ${formatValue(subValue)}`;
               case 'gt':
                  return `${alias}.${column} > ${formatValue(subValue)}`;
               case 'gte':
                  return `${alias}.${column} >= ${formatValue(subValue)}`;
               case 'in':
                  return `${alias}.${column} IN (${formatValue(subValue)})`;
               case 'notIn':
                  return `${alias}.${column} NOT IN (${formatValue(subValue)})`;
               case 'between':
                  return `${alias}.${column} BETWEEN ${formatValue(subValue[0])} AND ${formatValue(subValue[1])}`;
               case 'notBetween':
                  return `${alias}.${column} NOT BETWEEN ${formatValue(subValue[0])} AND ${formatValue(subValue[1])}`;
               case 'contains':
                  return `${alias}.${column} LIKE '%${subValue}%'`;
               case 'notContains':
                  return `${alias}.${column} NOT LIKE '%${subValue}%'`;
               case 'startsWith':
                  return `${alias}.${column} LIKE '${subValue}%'`;
               case 'endsWith':
                  return `${alias}.${column} LIKE '%${subValue}'`;
               case 'isNull':
                  return `${alias}.${column} IS NULL`;
               case 'isNotNull':
                  return `${alias}.${column} IS NOT NULL`;
               case 'isEmpty':
                  return `${alias}.${column} = ''`;
               case 'isNotEmpty':
                  return `${alias}.${column} != ''`;
               case 'isTrue':
                  return `${alias}.${column} = TRUE`;
               case 'isFalse':
                  return `${alias}.${column} = FALSE`;
               case 'like':
                  return `${alias}.${column} LIKE '%${subValue}%'`;
               case 'notLike':
                  return `${alias}.${column} NOT LIKE '%${subValue}%'`;
               case 'matches':
                  return `${alias}.${column} REGEXP '${subValue}'`;
               default:
                  return '';
            }
         })
         .join(' AND ');
      return `(${subConditions})`;
   }

   protected buildWhere(where: WhereArgs, model?: Model, aliases: { [key: string]: number } = {}) {
      model = model || this.xansql.getModel(this.table)
      const schema = model.schema.get()
      let alias = `${model.alias + (aliases[model.alias] || "")}`
      aliases[model.alias] = (aliases[model.alias] || 0) + 1
      let info = {
         alias,
         wheres: [] as string[],
         whereArgs: {} as any,
         relations: {} as { [column: string]: { where: object } }
      }

      for (let column in where) {
         const schemaValue = schema[column]
         if (!schemaValue) throw new Error(`Invalid column ${model.table}.${column}`)
         const is = schemaValue instanceof Relation
         if (is) {
            const relation = model.getRelation(column)
            const foreginModel = model.xansql.getModel(relation.foregin.table)
            const _where: any = where[column] || {}
            if (!info.relations[column]) {
               info.relations[column] = {
                  where: where[column] as any
               }
            }
            const build = this.buildWhere(_where, foreginModel, aliases)
            let _alias = build.alias
            info.wheres.push(`EXISTS (SELECT 1 FROM ${relation.foregin.table} ${_alias} WHERE ${_alias}.${relation.foregin.column} = ${relation.main.alias}.${relation.main.column} ${build.wheres.length ? ` AND ${build.wheres.join(" AND ")}` : ""})`)
         } else {
            info.whereArgs[column] = where[column]
            let v = ``
            if (isObject(where[column])) {
               const subConditions = this.buildWhereConditions(column, (where as any)[column], model.alias)
               v = subConditions
            } else if (Array.isArray(where[column])) {
               const subConditions = where[column].map((v: any) => {
                  if (isObject(v)) {
                     return this.buildWhereConditions(column, v, model.alias)
                  } else {
                     return `${alias}.${column} = ${formatValue(v)}`
                  }
               }).join(" OR ")
               v = `(${subConditions})`
            } else if (where[column] === null) {
               v = `${alias}.${column} IS NULL`
            } else if (where[column] === undefined) {
               v = `${alias}.${column} IS NOT NULL`
            } else {
               v = `${alias}.${column} = ${formatValue(where[column])}`
            }
            info.wheres.push(v)
         }
      }
      return info
   }

   protected async buildFind(args: FindArgs | RelationArgs, model: Model): Promise<BuildResult> {

      const isRelationArgs = args instanceof RelationArgs;
      const schema = model.schema.get()
      let _args = args as FindArgs;
      if (args instanceof RelationArgs) {
         _args = args.args as FindArgs;
      }

      const relation_args: any = {}
      const relations: { [column: string]: GetRelationType } = {}
      let select: string[] = []

      for (let column in _args.select) {
         const schemaValue = schema[column]
         if (!schemaValue) throw new Error(`Invalid column ${model.table}.${column}`)
         if (schemaValue instanceof Relation) {
            relation_args[column] = {
               select: _args.select[column]
            }
            if (_args?.limit && _args.limit[column]) {
               relation_args[column].limit = _args.limit[column]
            }
            if (_args?.orderBy && _args.orderBy[column]) {
               relation_args[column].orderBy = _args.orderBy[column]
            }
            const relation = model.getRelation(column)
            relations[column] = relation;
            if (!select.includes(relation.main.column)) {
               select.unshift(`${model.alias}.${relation.main.column}`);
            }
         } else {
            select.push(`${model.alias}.${column}`)
         }
      }

      if (select.length) {
         const idField = model.idField();
         let f = `${model.alias}.${idField}`
         if (!select.includes(f)) {
            select.unshift(f);
         }
      } else {
         select = ["*"];
      }

      let orderBysql = "";
      if (_args.orderBy) {
         let orderBy = []
         for (let column in _args.orderBy) {
            const schemaValue = schema[column]
            if (!schemaValue) throw new Error(`Invalid column ${model.table}.${column}`)
            if (schemaValue instanceof Relation) continue
            orderBy.push(`${model.alias}.${column} ${(_args as any).orderBy[column]}`)
         }
         orderBysql = orderBy.length ? ` ORDER BY ${orderBy.join(",")}` : ""
      }

      let sql = ''
      let main_sql = ''
      const buildWhere = this.buildWhere(_args.where, model)
      sql += buildWhere.wheres.length ? ` WHERE ${buildWhere.wheres.join(" AND ")}` : ""
      sql += orderBysql

      if (!isRelationArgs) {
         if (_args.limit) {
            const { maxFindLimit } = await this.xansql.getConfig()
            const take: number = (_args.limit.take || maxFindLimit) as any
            sql += ` LIMIT ${take}`
            if (_args.limit.skip || _args.limit.page) {
               let skip = _args.limit.skip
               sql += ` OFFSET ${skip}`
            }
         }

         main_sql = `SELECT ${select.join(",")} FROM ${model.table} ${model.alias} ${sql}`

      } else {
         const relation = args.relation as GetRelationType
         if (_args.limit && _args.limit?.take) {
            let take = _args.limit.take || 50
            let skip = _args.limit.skip || 0
            main_sql = `
            SELECT ${select.join(",")} FROM (
                 SELECT
                     ${select.join(",")},
                   ROW_NUMBER() OVER (PARTITION BY ${relation.foregin.alias}.${relation.foregin.column} ${orderBysql}) AS ${relation.foregin.alias}_rank
                 FROM ${relation.foregin.table} ${relation.foregin.alias}
                 WHERE ${relation.foregin.alias}.${relation.foregin.column} IN (${args.IN.join(",")})
               ) AS ${relation.foregin.alias}
               WHERE ${relation.foregin.alias}_rank > ${skip} AND ${relation.foregin.alias}_rank <= ${take + skip};
            `
         } else {
            main_sql = `
            SELECT ${select.length ? select.join(",") : "*"} 
            FROM ${relation.foregin.table} ${relation.foregin.alias}
            WHERE ${relation.foregin.alias}.${relation.foregin.column} IN (${args.IN.join(",")})
            ${sql}`
         }
      }

      const results = (await model.excute(main_sql)).result || []
      if (!results || !results.length) {
         return {
            type: isRelationArgs ? "relation" : "main",
            results: [],
            excuted: {
               sql: main_sql,
               data: [] // deep copy
            }
         }
      }

      const ids: number[] = []
      const singleIds: number[] = []
      const multipleIds: number[] = []
      const resultSingleIndex: any = {}
      const resultMultipleIndex: any = {}
      for (let result of results) {
         ids.push(result[(model as any).idField()])

         for (let column in relation_args) {
            const relation = relations[column]

            if (relation.single) {
               if (!singleIds.includes(result[relation.main.column])) {
                  singleIds.push(result[relation.main.column])
               }
            } else {
               if (!multipleIds.includes(result[relation.main.column])) {
                  multipleIds.push(result[(model as any).idField()])
               }
            }

            if (relation.single) {
               if (!resultSingleIndex[column]) resultSingleIndex[column] = {}
               if (!resultSingleIndex[column][result[relation.main.column]]) resultSingleIndex[column][result[relation.main.column]] = []
               resultSingleIndex[column][result[relation.main.column]].push(results.indexOf(result));
            } else {
               if (!resultMultipleIndex[column]) resultMultipleIndex[column] = {}
               resultMultipleIndex[column][result[relation.main.column]] = results.indexOf(result)
            }
         }
      }

      for (let column in relation_args) {
         const relation = relations[column]
         const rel_model = this.xansql.getModel(relation.foregin.table)
         const rel_args = relation_args[column]
         rel_args.select = rel_args.select || {}
         rel_args.select[relation.foregin.column] = true
         rel_args.where = rel_args.where || {}
         if (relation.single && rel_args.limit) {
            delete rel_args.limit
         }

         const ids = relation.single ? singleIds : multipleIds

         const rel_results: BuildResult = await rel_model.find(new RelationArgs(rel_args, ids, relation) as any) as any
         for (let result of rel_results.results || []) {
            if (relation.single) {
               const indexs = resultSingleIndex[column][result[relation.foregin.column]]
               for (let index of indexs) {
                  results[index][column] = result
               }
            } else {
               const index = resultMultipleIndex[column][result[relation.foregin.column]]
               if (index === undefined) continue
               if (!results[index][column]) results[index][column] = []
               results[index][column].push(result);
            }
         }
      }

      return {
         type: isRelationArgs ? "relation" : "main",
         results: results,
         excuted: {
            sql: sql,
            data: [] // deep copy
         }
      }
   }

   protected async _buildFind(args: FindArgs | RelationArgs, model: Model): Promise<BuildResult> {
      // if (!args.where || !Object.keys(args.where).length) throw new Error("Where clause is required");
      const isRelationArgs = args instanceof RelationArgs;
      if (args instanceof RelationArgs) {
         args = args.args as FindArgs;
      }

      const schema = model.schema.get()
      const idField: string = model.idField() as any
      let columns: string[] = []
      let ralation_columns: { [foregin: string]: string } = {}

      let relations: {
         [column: string]: {
            relation: GetRelationType,
            args: FindArgs,
         }
      } = {}

      for (let column in args.select) {
         const schemaValue = schema[column]
         if (!schemaValue) throw new Error(`Invalid column ${model.table}.${column}`)
         if (schemaValue instanceof Relation) {
            const relation = model.getRelation(column)

            let _args: any = {}
            if (args.select && column in args.select) {
               _args.select = args.select[column]
               if (isObject(_args.select) && !(relation.foregin.column in _args.select)) {
                  _args.select = {
                     [relation.foregin.column]: true,
                     ..._args.select
                  }
               }
            }
            if (args.orderBy && column in args.orderBy) {
               _args.orderBy = args.orderBy[column]
            }
            if (args.limit && column in args.limit) {
               _args.limit = args.limit[column]
            }
            if (args.where && column in args.where) {
               _args.where = args.where[column]
            }

            relations[column] = {
               relation: relation,
               args: _args
            }
            if (!columns.includes(relation.main.column)) {
               columns = [
                  relation.main.column,
                  ...columns
               ]
            }
            ralation_columns[relation.foregin.column] = relation.main.column
         } else {
            columns.push(column)
         }
      }

      if (columns.length && !columns.includes(idField)) {
         columns = [idField, ...columns]
      }
      let _fields = columns.length ? columns.join(',') : ["*"]
      let sql = `SELECT ${_fields} FROM ${model.table} ${model.alias}`
      const buildWhere = this.buildWhere(args.where, model)
      sql += buildWhere.wheres.length ? ` WHERE ${buildWhere.wheres.join(" AND ")}` : ""

      if (args.orderBy) {
         let orderByFields: string[] = Object.keys(args.orderBy).filter((column) => !(schema[column] instanceof Relation))
         let orderBy: string[] = orderByFields.map((column) => `${column} ${(args as any).orderBy[column]}`)
         sql += orderByFields.length ? ` ORDER BY ${orderBy.join(",")}` : ""
      }


      if (!isRelationArgs) {
         const { maxFindLimit } = await this.xansql.getConfig()
         const take: number = (args?.limit?.take || maxFindLimit) as any
         sql += ` LIMIT ${take}`
         if (args.limit?.skip || args.limit?.page) {
            let skip = args.limit.skip
            sql += `OFFSET ${skip}`
         }
      }

      // excute sql
      const results = (await model.excute(sql)).result
      const resultFormat: BuildResult = {
         type: isRelationArgs ? "relation" : "main",
         results,
         excuted: {
            sql: sql,
            data: JSON.parse(JSON.stringify(results || [])) // deep copy
         }
      }
      if (!resultFormat.results || !resultFormat.results.length) return resultFormat

      let ins: { [foregin_column: string]: any[] /** ids */ } = {}

      const resultIndex: any = {}
      for (let foregin_column in ralation_columns) {
         let main_column = ralation_columns[foregin_column]
         if (!(foregin_column in ins)) {
            ins[foregin_column] = []
            for (let i = 0; i < results.length; i++) {
               let result = results[i]
               if (!ins[foregin_column].includes(result[main_column])) {
                  ins[foregin_column].push(result[main_column])
               }
               if (!resultIndex[foregin_column]) resultIndex[foregin_column] = {}
               resultIndex[foregin_column][result[main_column]] = i
            }
         }
      }

      for (let column in relations) {
         const relation = relations[column]
         let _model = this.xansql.getModel(relation.relation.foregin.table)
         let foregin_column = relation.relation.foregin.column
         let _in_values = ins[foregin_column] || []
         let _in: any = { column: `${relation.relation.foregin.alias}.${foregin_column}`, values: _in_values }

         if (!relation.args.where) relation.args.where = {}
         if (foregin_column in relation.args.where) {
            let rcol: any = relation.args.where[foregin_column]
            if (isObject(rcol)) {
               if (rcol.in) {
                  rcol.in = [..._in.values, ...rcol.in]
               } else {
                  rcol.in = _in.values
               }
            } else {
               rcol = { in: _in.values, equals: rcol }
            }
            relation.args.where[foregin_column] = rcol
         } else {
            relation.args.where[foregin_column] = {
               in: _in.values
            }
         }

         relation.args.limit = {}
         const rel_results: BuildResult = await _model.find(new RelationArgs(relation.args) as any) as any

         if (relation.relation.single) {
            for (let mres of resultFormat.results) {
               if (!rel_results.results?.length) {
                  mres[column] = null
               } else {
                  mres[column] = rel_results.results[0]
               }
            }
         } else {
            for (let rel_result of (rel_results.results || [])) {
               let res: any = rel_result
               const id = res[foregin_column]
               const index = resultIndex[foregin_column][id]
               if (index !== undefined) {
                  if (!resultFormat.results[index][column]) resultFormat.results[index][column] = []
                  resultFormat.results[index][column].push(res)
               }
            }
         }
      }

      return resultFormat
   }

   protected async buildCreate(args: CreateArgs | RelationArgs, model: Model): Promise<BuildResult> {
      const isRelationArgs = args instanceof RelationArgs;
      if (args instanceof RelationArgs) {
         args = args.args as CreateArgs;
      }
      let { data, select } = args
      const schema = model.schema.get()
      let fields: { [column: string]: any } = {}
      let relations: {
         [column: string]: {
            relation: GetRelationType,
            data: CreateArgsData[],
         }
      } = {}

      if (isArray(data)) {
         let res: any = []
         for (let _data of data) {
            const { results, excuted } = await this.buildCreate({
               data: _data,
               select: select
            }, model)
            res = [...res, ...(results || [])]
         }
         const resultFormat: BuildResult = {
            type: isRelationArgs ? "relation" : "main",
            results: res,
            excuted: {
               sql: "",
               data: JSON.parse(JSON.stringify(res || [])) // deep copy
            }
         }
         return resultFormat
      } else {
         for (let column in data) {
            const schemaValue = schema[column]
            if (!schemaValue) throw new Error(`Invalid column ${model.table}.${column}`)
            if (schemaValue instanceof Relation) {
               const relation = model.getRelation(column)
               const rvalue = data[column]
               if (relation.single) throw new Error(`Invalid column ${column}`)
               if (!isArray(rvalue)) throw new Error(`Data must be an array ${column}`)
               if (rvalue.length) {
                  relations[column] = {
                     relation: relation,
                     data: rvalue
                  }
               }
            } else {
               fields[column] = formatValue(data[column])
            }
         }

         let columns = Object.keys(fields)
         let values = Object.values(fields)

         let sql = `INSERT INTO ${model.table} (${columns.join(",")}) VALUES (${values.join(",")})`
         const excute = await model.excute(sql)
         let result = null
         let findArgs: any = {}
         let idField = Object.keys(schema).find((column) => schema[column] instanceof IDField)
         if (!idField) throw new Error(`Invalid column ${model.table}.${idField}`)
         if (excute.insertId) {
            result = [{ [idField]: excute.insertId }]
            findArgs.where = { [idField]: excute.insertId }
         }

         if (select === 'partial' || select === 'full') {
            if (select === 'partial') {
               findArgs.select = {}
               for (let column in fields) {
                  // if (column === foregineColumn) continue
                  findArgs.select[column] = true
               }
            }
            let { results } = await this.buildFind(findArgs, model)
            result = [{ [idField]: excute.insertId, ...(results ? results[0] : []) }]
         }

         const resultFormat: BuildResult = {
            type: isRelationArgs ? "relation" : "main",
            results: result,
            excuted: {
               sql: sql,
               data: JSON.parse(JSON.stringify(result || [])) // deep copy
            }
         }

         if (!resultFormat.results || !resultFormat.results.length) return resultFormat
         const excuteResult: any = resultFormat.results[0]
         for (let column in relations) {
            const { relation, data: rel_data } = relations[column]
            const _model = this.xansql.getModel(relation.foregin.table)
            for (let arg of rel_data) {
               arg[relation.foregin.column] = excuteResult[relation.main.column]
            }
            const _foreginResult = await _model.create(new RelationArgs({ data: rel_data, select }) as any)
            excuteResult[column] = _foreginResult
         }
         return excuteResult
      }
   }

   protected async buildUpdate(args: UpdateArgs | RelationArgs, model: Model): Promise<BuildResult> {
      const isRelationArgs = args instanceof RelationArgs;
      if (args instanceof RelationArgs) {
         args = args.args as UpdateArgs;
      }
      let { data, where, select } = args
      const schema = model.schema.get()
      let fields: { [column: string]: any } = {}
      let relations: {
         [column: string]: {
            relation: GetRelationType,
            data: UpdateArgsData[],
         }
      } = {}

      if (isArray(data)) {
         let res: any = []
         let sql = ""
         for (let _data of data) {
            const { results, excuted } = await this.buildUpdate({
               data: _data,
               where,
               select
            }, model)
            res = [...res, ...(results || [])]
            sql += excuted.sql + "; "
         }
         const resultFormat: BuildResult = {
            type: isRelationArgs ? "relation" : "main",
            results: res,
            excuted: {
               sql: sql,
               data: JSON.parse(JSON.stringify(res || [])) // deep copy
            }
         }
         return resultFormat
      } else {
         for (let column in data) {
            const schemaValue = schema[column]
            if (!schemaValue) throw new Error(`Invalid column ${model.table}.${column}`)
            if (schemaValue instanceof Relation) {
               const relation = model.getRelation(column)
               const rvalue = data[column]
               if (relation.single) throw new Error(`Invalid column ${column}`)
               if (isArray(rvalue)) throw new Error(`Data must be an array ${column}`)
               relations[column] = {
                  relation: relation,
                  data: rvalue as any
               }
            } else {
               fields[column] = formatValue(data[column])
            }
         }

         let columns = Object.keys(fields)
         let values = []
         for (let column of columns) {
            values.push(`${column} = ${fields[column]}`)
         }
         const resultFormat: BuildResult = {
            type: isRelationArgs ? "relation" : "main",
            results: null,
            excuted: {
               sql: "",
               data: []
            }
         }
         if (values.length) {
            const buildWhere = this.buildWhere(where, model)
            resultFormat.excuted.sql = `UPDATE ${model.table} ${model.alias} SET ${values.join(", ")}`
            resultFormat.excuted.sql += ` WHERE ${buildWhere.wheres.join(" AND ")}`
            const excute = await model.excute(resultFormat.excuted.sql)
            if (!excute.affectedRows) return resultFormat
         }

         let idField = Object.keys(schema).find((column) => schema[column] instanceof IDField)
         if (!idField) throw new Error(`Invalid column ${model.table}.${idField}`)
         let findArgs: any = {}
         findArgs.where = where

         if (select === 'partial' || select === 'full') {
            if (select === 'partial') {
               findArgs.select = {
                  [idField]: true
               }
               for (let column in fields) {
                  // if (column === foregineColumn) continue
                  findArgs.select[column] = true
               }
            }
         } else {
            findArgs.select = {
               [idField]: true
            }
         }

         let { results } = await this.buildFind(findArgs, model)
         if (!results || !results.length) return resultFormat
         resultFormat.results = results

         for (let res of resultFormat.results) {
            for (let column in relations) {
               const { relation, data: rel_data } = relations[column]
               let _rel_data: any = rel_data
               const _model = this.xansql.getModel(relation.foregin.table)
               const columnWhere: any = where[column] || {}
               let rel_where: any = { ...columnWhere, [relation.foregin.column]: (res as any)[relation.main.column] }
               _rel_data[relation.foregin.column] = (res as any)[relation.main.column]

               const _foreginResult = await _model.update({ data: _rel_data, where: rel_where, select });
               (res as any)[column] = _foreginResult
            }
         }
         return resultFormat
      }
   }

   protected async buildDelete(args: DeleteArgs | RelationArgs, model: Model): Promise<BuildResult> {
      const isRelationArgs = args instanceof RelationArgs;
      if (args instanceof RelationArgs) {
         args = args.args as DeleteArgs;
      }
      const { where } = args
      const idField = model.idField() as string
      const result = await this.buildFind({ where, select: { [idField]: true } }, model)
      const resultFormat: BuildResult = {
         type: isRelationArgs ? "relation" : "main",
         results: result.results,
         excuted: {
            sql: "",
            data: JSON.parse(JSON.stringify(result.results || [])) // deep copy
         }
      }
      if (!resultFormat.results || !resultFormat.results.length) return resultFormat
      // if (!result || !count._count) return 0

      const schema = this.schema.get()
      for (let column in schema) {
         const schemaValue = schema[column]
         if (!schemaValue) throw new Error(`Invalid column ${model.table}.${column}`)
         if (schemaValue instanceof Relation && schemaValue.column && schemaValue.table) {
            const relation = model.getRelation(column)
            const foreginModel = this.xansql.getModel(schemaValue.table)
            const foreginSchema = foreginModel.schema.get()

            const foreginColumn: any = foreginSchema[schemaValue.column]
            const constraints = foreginColumn.constraints
            let _model = this.xansql.getModel(relation.foregin.table)

            switch (constraints.onDelete) {
               case "CASCADE":
                  await _model.delete(new RelationArgs({
                     where: {
                        [relation.foregin.field]: where
                     }
                  }) as any)
                  break;
               case "SET NULL":
                  await _model.update(new RelationArgs({
                     data: {
                        [relation.foregin.field]: null
                     },
                     where: {
                        [relation.foregin.field]: where
                     }
                  }) as any)
                  break;
               case "SET DEFAULT":
                  await _model.update(new RelationArgs({
                     data: {
                        [relation.foregin.field]: constraints.default
                     },
                     where: {
                        [relation.foregin.field]: where
                     }
                  }) as any)
                  break;
               case "RESTRICT":
               case "NO ACTION":
                  let _count = await _model.count(new RelationArgs({
                     where: {
                        [relation.foregin.field]: where
                     }
                  }) as any)
                  if (_count._count) throw new Error(`Cannot delete ${model.table}.${column} because it is referenced by ${relation.foregin.table}.${relation.foregin.field}`)
                  break;
            }
         }
      }

      const buildWhere = this.buildWhere(where, model)
      let sql = `DELETE FROM ${model.table} ${model.alias}`
      sql += ` WHERE ${buildWhere.wheres.join(" AND ")}`
      const excute = await model.excute(sql)
      if (!excute.affectedRows) {
         resultFormat.results = null
         resultFormat.excuted.sql = sql
         resultFormat.excuted.data = null
         return resultFormat
      }
      resultFormat.excuted.sql = sql
      return resultFormat
   }

   protected async buildCount(args: CountArgs | RelationArgs, model: Model): Promise<BuildResult> {
      const isRelationArgs = args instanceof RelationArgs;
      if (args instanceof RelationArgs) {
         args = args.args as CountArgs;
      }
      const { where, select } = args
      const buildWhere = this.buildWhere(where, model)
      let sql = `SELECT COUNT(*) as count FROM ${model.table} ${model.alias}`
      sql += buildWhere.wheres.length ? ` WHERE ${buildWhere.wheres.join(" AND ")}` : ""
      const excute = await model.excute(sql)
      const resultFormat: BuildResult = {
         type: isRelationArgs ? "relation" : "main",
         results: [{ _count: 0 }],
         excuted: {
            sql: sql,
            data: [{ _count: 0 }]// deep copy
         }
      }

      if (!excute.result || !excute.result.length) return resultFormat
      resultFormat.results = [{ _count: excute.result[0].count }]
      resultFormat.excuted.data = JSON.parse(JSON.stringify(resultFormat.results || [])) // deep copy

      for (let _select in select) {
         let selectValue = select[_select]
         const schemaValue = model.schema.get()[_select]
         if (!schemaValue) throw new Error(`Invalid column ${model.table}.${_select}`)
         if (schemaValue instanceof Relation) {
            const relation = model.getRelation(_select)
            let _model = this.xansql.getModel(relation.foregin.table)
            let d: any = {}
            let _count: BuildResult = await _model.count(new RelationArgs({
               where: {
                  [relation.foregin.field]: where
               }
            }) as any) as any
            if (!_count.results || !_count.results.length) {
               d._count = (_count.results as any)[0]._count || 0
            }
            if (isObject(selectValue)) {
               const build = await _model.count(new RelationArgs({ where: { [relation.foregin.field]: where }, select: selectValue as any }) as any)
               d = {
                  ...d,
                  ...((build.results as any)[0] || {}) // assuming results is an array with one object
               }
            }
            resultFormat.results[0][_select] = d
         }
      }
      return resultFormat
   }
}

export default ModelBase