import Model from ".."
import Relation from "../../schema/core/Relation"
import { isObject } from "../../utils"
import { FindArgs, GetRelationType } from "../type"


type RelationFactory = {
   [column: string]: buildFindArgs
}


type JoinFactory = {
   [column: string]: string
}

class buildFindArgs {
   private model: Model
   private args: FindArgs

   private relations: RelationFactory = {}
   private joins: JoinFactory = {}
   private select: string[] = []

   private where: string[] = []
   private limit: string[] = []
   private orderBy: string[] = []
   private relation: GetRelationType | null = null


   constructor(model: Model, args: FindArgs) {
      this.model = model
      this.args = args

      if (!args.where) {
         throw new Error(`Where condition is required`)
      }
      const schema = model.schema.get()

      let wh = this.buildSelect(args, model)
      console.log(wh);


      // format select 
      if (args.select) {
         for (let column in args.select) {
            const schemaValue = schema[column]
            if (!schemaValue) throw new Error(`Invalid column ${model.table}.${column}`)
            const is = schemaValue instanceof Relation
            if (!is) {
               this.select.push(`${model.alias}.${column}`)
            }
         }
      }

      if (args.orderBy) {
         for (let column in args.orderBy) {
            const schemaValue = schema[column]
            if (!schemaValue) throw new Error(`Invalid column ${model.table}.${column}`)
            const is = schemaValue instanceof Relation
            if (!is) {
               this.orderBy.push(`${model.alias}.${column} ${args.orderBy[column]}`)
            }
         }
      }

      if (args.limit) {
         this.limit.push(`LIMIT ${args.limit.take || 0} OFFSET ${args.limit.skip || 0}`)
      }

      for (let column in args.where) {
         const value = args.where[column]
         const schemaValue = schema[column]
         if (!schemaValue) throw new Error(`Invalid column ${model.table}.${column}`)

         if (schemaValue instanceof Relation) {
            // this.buildJoin(column)
         } else {
            if (isObject(value)) {

            } else {
               this.where.push(`${model.alias}.${column} = '${value}'`)
            }
         }
      }
   }

   getSelectFields(select: FindArgs['select'], model: Model) {
      let _selectFields: string[] = []

      for (let column in select) {
         const schemaValue = model.schema.get()[column]
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

      for (let column in orderBy) {
         const schemaValue = model.schema.get()[column]
         if (!schemaValue) throw new Error(`Invalid column ${model.table}.${column}`)
         const is = schemaValue instanceof Relation
         if (!is) {
            _orderByFields.push(`${model.alias}.${column} ${orderBy[column]}`)
         }
      }
      return _orderByFields
   }

   buildWhere(args: FindArgs, model: Model) {
      const where = args.where
      let _wheres: string[] = []
      let _joins: JoinFactory = {}
      const schema = model.schema.get()
      for (let column in where) {
         const value = where[column]
         const schemaValue = schema[column]
         if (!schemaValue) throw new Error(`Invalid column ${model.table}.${column}`)
         if (schemaValue instanceof Relation) {
            const relation = model.getRelation(column)
            const foreginModel = model.xansql.getModel(relation.foregin.table)
            const newargs: any = {
               where: value
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

            const build = this.buildWhere(newargs, foreginModel)
            if (newargs.limit?.take || newargs.limit?.skip) {
               let _selectFields: string[] = this.getSelectFields(newargs.select, foreginModel)
               let _orderByFields: string[] = this.getOrderByFields(newargs.orderBy, foreginModel)
               _joins[column] = `JOIN (
                  SELECT ${_selectFields.length ? _selectFields.join(', ') : "*"} FROM ${relation.foregin.table} ${relation.foregin.alias}
                  WHERE ${_wheres.join(" AND ")}
                  ${_orderByFields.length ? `ORDER BY ${_orderByFields.join(', ')}` : ""}
                  ${newargs.limit ? `LIMIT ${newargs.limit.take || 0} OFFSET ${newargs.limit.skip || 0}` : ""}
               ) ${relation.foregin.alias} ON ${relation.main.alias}.${relation.main.column} = ${relation.foregin.alias}.${relation.foregin.column}`
            } else {
               _joins[column] = `JOIN ${relation.foregin.table} ${relation.foregin.alias} ON ${relation.main.alias}.${relation.main.column} = ${relation.foregin.alias}.${relation.foregin.column}`
               _joins[column] += build.where.length ? ` AND ${build.where.join(" AND ")}` : ""
            }

            _joins = {
               ..._joins,
               ...build.joins
            }
         } else {
            if (isObject(value)) {

            } else {
               _wheres.push(`${model.alias}.${column} = '${value}'`)
            }
         }
      }
      return {
         where: _wheres,
         joins: _joins
      }
   }


   buildSelect(args: FindArgs, model: Model) {
      const select = args.select
      let _wheres: string[] = []
      let _selects: string[] = []
      let _joins: JoinFactory = {}
      const schema = model.schema.get()
      for (let column in select) {
         const value = select[column]
         const schemaValue = schema[column]
         if (!schemaValue) throw new Error(`Invalid column ${model.table}.${column}`)
         if (schemaValue instanceof Relation) {

         } else {
            if (isObject(value)) {

            } else {
               _selects.push(`${model.alias}.${column}`)
            }
         }
      }
      return {
         select: _selects,
         where: _wheres,
         joins: _joins
      }
   }

   buildJSONArrayAGG() {
      let q = []
      for (let column in this.relations) {
         const builder = this.relations[column]
         if (!builder.select.length) continue

         q.push(`
            JSON_ARRAYAGG(
               JSON_OBJECT(
                  ${builder.select.map((col) => `'${col.split('.')[1]}', ${col}`).join(",")}
               )
            ) AS ${column}
         `)
      }
      return q
   }

   build() {
      let sql = `SELECT ${this.select.join(", ")} FROM ${this.model.table} ${this.model.alias}`
      if (this.where.length) {
         sql += ` WHERE ${this.where.join(" AND ")}`
      }
      if (this.orderBy.length) {
         sql += ` ORDER BY ${this.orderBy.join(", ")}`
      }
      if (this.limit.length) {
         sql += ` ${this.limit.join(" ")}`
      }

      // this.buildJSONArrayAGG()
      // console.log(this.relations);


      return sql
   }


}

export default buildFindArgs