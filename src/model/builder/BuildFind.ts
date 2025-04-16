import Model from ".."
import Relation from "../../schema/core/Relation"
import { FindArgs } from "../type"

type UsesAliases = { [alias: string]: number }

class BuilFind {
   model: Model
   args: FindArgs
   constructor(model: Model, args: FindArgs) {
      this.model = model
      this.args = args
   }

   jsonObject = (fields: string) => {
      let dialect = this.model.xansql.getDialect().driver
      if (dialect === 'mysql') return `JSON_OBJECT(${fields})`;
      if (dialect === 'postgres') return `json_build_object(${fields})`;
      if (dialect === 'sqlite') return `json_object(${fields})`;
      throw new Error("Dialect not supported");
   };

   jsonArrayAgg = (expr: string) => {
      let dialect = this.model.xansql.getDialect().driver
      if (dialect === 'mysql') return `JSON_ARRAYAGG(${expr})`;
      if (dialect === 'postgres') return `json_agg(${expr})`;
      if (dialect === 'sqlite') return `json_group_array(${expr})`;
      throw new Error("Dialect not supported");
   };

   getSelectFields(select: FindArgs['select'], model: Model) {
      const schema = model.schema.get()
      let _selectFields: string[] = []
      let s: any = select
      if (s === true) {
         for (let column in schema) {
            const is = schema[column] instanceof Relation
            if (!is) {
               _selectFields.push(`${model.alias}.${column}`)
            }
         }

         return _selectFields
      }

      for (let column in select) {
         if (column === "*") {
            for (let column in schema) {
               const is = schema[column] instanceof Relation
               if (!is) {
                  _selectFields.push(`${model.alias}.${column}`)
               }
            }
            return _selectFields
         }
         const schemaValue = schema[column]
         if (!schemaValue) throw new Error(`Invalid column ${model.table}.${column}`)
         const is = schemaValue instanceof Relation
         if (!is) {

            _selectFields.push(`${model.alias}.${column}`)

         }
      }
      return _selectFields
   }

   getOrderByFields(orderBy: FindArgs['orderBy'], model: Model) {
      let _orderByFields: string[] = []
      const schema = model.schema.get()
      for (let column in orderBy) {
         const schemaValue = schema[column]
         if (!schemaValue) throw new Error(`Invalid column ${model.table}.${column}`)
         const is = schemaValue instanceof Relation
         if (!is) {
            _orderByFields.push(`${model.alias}.${column} ${orderBy[column]}`)
         }
      }
      return _orderByFields
   }

   private buildSelect(args: FindArgs, model: Model, usesAliases: UsesAliases, asCol = true) {
      const schema = model.schema.get()

      let alias = `${model.alias + (usesAliases[model.alias] || "")}`
      usesAliases[model.alias] = (usesAliases[model.alias] || 0) + 1

      const info = {
         alias,
         fields: [] as string[],
         joins: [] as string[],
         wheres: [] as string[],
      }

      for (let column in args.select) {
         // const value = args.select[column]
         const schemaValue = schema[column]
         if (!schemaValue) throw new Error(`Invalid column ${model.table}.${column}`)
         if (schemaValue instanceof Relation) {
            const relation = model.getRelation(column)
            const foreginModel = model.xansql.getModel(relation.foregin.table)

            const newargs: any = {
               where: (args as any).where[column] || {}
            }
            if (args.select && column in args.select) {
               newargs.select = args.select[column]
            }
            if (args.limit && column in args.limit) {
               newargs.limit = (args.limit as any)[column]
            }
            if (args.orderBy && column in args.orderBy) {
               newargs.orderBy = args.orderBy[column]
            }
            if (relation.single) {
               usesAliases[model.alias] = (usesAliases[model.alias] || 0) - 1
            }
            const _info = this.buildSelect(newargs, foreginModel, usesAliases, false)
            const isLimit = newargs.limit?.take || newargs.limit?.skip
            const isOrderBy = newargs.orderBy && Object.keys(newargs.orderBy).length > 0

            let formatedFields = []
            for (let col of _info.fields) {
               if (col.startsWith("(") || col.startsWith("'")) {
                  formatedFields.push(col)
               } else {
                  formatedFields.push(`'${col.split('.')[1]}', ${col}`)
               }
            }
            let json_object = this.jsonObject(formatedFields.join(", "))
            let sql = relation.single ? json_object : this.jsonArrayAgg(json_object)

            if (isLimit) {
               let _orderByFields: string[] = this.getOrderByFields(newargs.orderBy, foreginModel)
               sql = `(SELECT ${sql} FROM ${relation.foregin.table} ${relation.foregin.alias} 
               ${_info.joins.length ? ` ${_info.joins.join(" ")}` : ""}
               WHERE ${relation.main.alias}.${relation.main.column} = ${_info.alias}.${relation.foregin.column} ${info.wheres.length ? `WHERE ${info.wheres.join(" AND ")}` : ""}
               ${_orderByFields.length ? `ORDER BY ${_orderByFields.join(', ')}` : ""}
               ${newargs.limit ? ` ${newargs.limit.take ? `LIMIT ${newargs.limit.take}` : ""} ${newargs.limit.skip ? `OFFSET ${newargs.limit.skip}` : ""}` : ""}
            )`
            }

            if (asCol) {
               sql = `${sql} AS ${column}`
            } else {
               sql = `'${column}', ${sql}`
            }

            info.fields.push(sql)

            if (!isLimit && !relation.single) {
               let rel = `${relation.foregin.table} ${_info.alias} ON ${relation.main.alias}.${relation.main.column} = ${_info.alias}.${relation.foregin.column}`
               info.joins.push(`JOIN ${rel} ${_info.wheres.length ? `WHERE ${_info.wheres.join(" AND ")}` : ""}`)
               info.joins = [
                  ...info.joins,
                  ..._info.joins,
               ]
            }
         } else {
            info.fields.push(`${alias}.${column}`)
         }
      }
      return info
   }

   private buildWhere() {

   }

   build() {
      const select = this.buildSelect(this.args, this.model, {})
      let sql = `SELECT ${select.fields.join(", ")} FROM ${this.model.table} ${select.alias}`
      sql += ` ${select.joins.join(" ")}`
      sql += ` GROUP BY u.id, u.name`
      console.log(sql);

   }

}

export default BuilFind