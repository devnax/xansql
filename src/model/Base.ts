import Model from ".";
import xansql from "..";
import Schema, { id } from "../schema";
import Column from "../schema/core/Column";
import Relation from "../schema/core/Relation";
import { formatValue, isObject } from "../utils";
import { FindArgs, GetRelationType, WhereArgs, WhereSubCondition } from "./type";


abstract class ModelBase {
   xansql: xansql;
   table: string = "";
   alias: string = "";
   schema: Schema = new Schema({ id: id() });

   constructor(xansql: xansql) {
      this.xansql = xansql
   }

   getRelation(column: string) {
      const schema = this.schema.get()
      const relation_column = schema[column]
      if (!(relation_column instanceof Relation)) throw new Error(`Invalid relation column ${this.table}.${column}`)

      if (!relation_column.table) {
         const reference: any = schema[relation_column.column];
         let foregin_table = reference.constraints.references.table
         let foregin_column = reference.constraints.references.column
         if (!foregin_table) throw new Error(`Invalid relation column ${this.table}.${column}`)
         if (!foregin_column) throw new Error(`Invalid relation column ${this.table}.${column}`)
         return {
            single: true,
            main: {
               table: this.table,
               column: relation_column.column,
               alias: this.alias,
            },
            foregin: {
               table: foregin_table,
               column: foregin_column,
               alias: this.xansql.getModel(foregin_table).alias
            }
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

         return {
            single: false,
            main: {
               table: references.table,
               column: references.column,
               alias: this.alias,
            },
            foregin: {
               table: relation_column.table as string,
               column: relation_column.column,
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
      }

      for (let column in where) {
         const schemaValue = schema[column]
         if (!schemaValue) throw new Error(`Invalid column ${model.table}.${column}`)
         const is = schemaValue instanceof Relation
         if (is) {
            const relation = model.getRelation(column)
            const foreginModel = model.xansql.getModel(relation.foregin.table)
            const _where: any = where[column]

            const build = this.buildWhere(_where, foreginModel, aliases)
            info.wheres.push(`EXISTS (SELECT 1 FROM ${relation.foregin.table} ${build.alias} WHERE ${build.alias}.${relation.foregin.column} = ${relation.main.alias}.${relation.main.column} AND ${build.wheres.join(" AND ")})`)
         } else {
            let v = `${alias}.${column} = '${where[column]}'`
            if (isObject(where[column])) {
               const subConditions = this.buildWhereConditions(column, (where as any)[column], model.alias)
               v = subConditions
            } else if (Array.isArray(where[column])) {
               const subConditions = where[column].map((v: any) => {
                  if (isObject(v)) {
                     return this.buildWhereConditions(column, v, model.alias)
                  } else {
                     return `${alias}.${column} = '${v}'`
                  }
               }).join(" OR ")
               v = `(${subConditions})`
            } else if (where[column] === null) {
               v = `${alias}.${column} IS NULL`
            } else if (where[column] === undefined) {
               v = `${alias}.${column} IS NOT NULL`
            }
            info.wheres.push(v)
         }
      }
      return info
   }

   protected async buildFind(args: FindArgs, model: Model) {
      const schema = model.schema.get()
      let columns: string[] = []
      let rel_columns: { [column: string]: string } = {}
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
            if (relation.single) {
               _args.limit = { take: 1, skip: 0 }
            }
            relations[column] = {
               relation: relation,
               args: _args
            }
            if (!columns.includes(relation.main.column)) {
               columns.push(relation.main.column)
               rel_columns[column] = relation.foregin.column
            }
         } else {
            columns.push(column)
         }
      }

      let _fields = columns.length ? columns.join(',') : ["*"]
      let sql = `SELECT ${_fields} FROM ${model.table} ${model.alias}`
      const buildWhere = this.buildWhere(args.where, model)
      sql += ` WHERE ${buildWhere.wheres.join(" AND ")}`


      if (args.orderBy) {
         let orderByFields: string[] = Object.keys(args.orderBy).filter((column) => !(schema[column] instanceof Relation))
         let orderBy: string[] = orderByFields.map((column) => `${column} ${(args as any).orderBy[column]}`)
         sql += ` ORDER BY ${orderBy.join(",")}`
      }
      if (args.limit?.take || args.limit?.skip || args.limit?.page) {
         let take = args.limit.take || 0
         let skip = args.limit.skip
         if (args.limit.page) {
            skip = (args.limit.page - 1) * take
         }
         sql += `${take ? ` LIMIT ${take}` : ""} ${skip ? `OFFSET ${skip}` : ""}`
      }

      console.log(sql);


      // excute sql
      // const result = await this.xansql.query(sql)
      let results: any[] = []
      let _ins: { [rel_rable_column: string]: ({ [val: string | number]: any }) } = {}

      for (let rel_column in rel_columns) {
         let rel_rable_column = rel_columns[rel_column]
         if (!(rel_rable_column in _ins)) {
            let format: any = {}
            results.forEach((result, index) => {
               format[result[rel_rable_column]] = index
            })
            _ins[rel_rable_column] = format
         }
      }
      console.log(sql);

      for (let column in relations) {
         const relation = relations[column]
         let _model = this.xansql.getModel(relation.relation.foregin.table)
         let rel_rable_column = rel_columns[column]
         let _in_values = _ins[rel_rable_column] || []
         let _in: any = { column: `${relation.relation.foregin.alias}.${rel_rable_column}`, values: Object.keys(_in_values) }

         if (rel_rable_column in relation.args.where) {
            let rcol: any = relation.args.where[rel_rable_column]
            if (isObject(rcol)) {
               if (rcol.in) {
                  rcol.in = [..._in.values, ...rcol.in]
               } else {
                  rcol.in = _in.values
               }
            } else {
               rcol = { in: _in.values, equals: rcol }
            }
            relation.args.where[rel_rable_column] = rcol
         } else {
            relation.args.where[rel_rable_column] = {
               in: _in.values
            }
         }

         const rel_results = await this.buildFind(relation.args, _model)

         for (let r_res of rel_results) {
            let _index = _in_values[r_res[rel_rable_column]]
            if (_index !== undefined) {
               if (relation.relation.single) {
                  results[_index][column] = r_res
               } else {
                  if (!results[_index][column]) results[_index][column] = []
                  results[_index][column].push(r_res)
               }
            }
         }
      }
      return results
   }
}

export default ModelBase