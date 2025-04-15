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
   }

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


   buildSelect(args: FindArgs, model: Model, asCol = true) {
      let select = args.select
      let _wheres: string[] = []
      let _selects: string[] = []
      let _joins: JoinFactory = {}
      let _groupBy: any = {}
      const schema = model.schema.get()

      if ((select as any)["*"]) {
         delete (select as any)["*"]
         for (let column in schema) {
            const is = schema[column] instanceof Relation
            if (!is) {
               (select as any)[column] = true
            }
         }
      }

      for (let column in select) {
         const value = select[column]
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
               if (newargs.select === true) {
                  newargs.select = {
                     "*": true
                  }
               }
            }
            if (args.limit && column in args.limit) {
               newargs.limit = (args.limit as any)[column]
            }
            if (args.orderBy && column in args.orderBy) {
               newargs.orderBy = args.orderBy[column]
            }
            let _selectFields: string[] = this.getSelectFields(newargs.select, foreginModel)

            const build = this.buildSelect(newargs, foreginModel, false)
            const buildArr = build.select.filter(col => col.includes("JSON")).join(",")

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
               ...build.joins,
            }

            let sql = ''

            if (relation.single) {
               sql = `JSON_OBJECT(
                     ${_selectFields.map((col) => `'${col.split('.')[1]}', ${col}`).join(",")}${buildArr.length ? "," + buildArr : ""}
                  )`
            } else {
               sql = `JSON_ARRAYAGG(
                  JSON_OBJECT(
                     ${_selectFields.map((col) => `'${col.split('.')[1]}', ${col}`).join(",")}${buildArr.length ? "," + buildArr : ""}
                  )
               )`
            }

            if (asCol) {
               _selects.push(`${sql} AS ${column}`)
            } else {
               _selects.push(`'${column}', ${sql}`)
            }
            _groupBy = {
               ..._groupBy,
               ...build.groupBy
            }
         } else {
            _selects.push(`${model.alias}.${column}`)
            _groupBy[`${model.alias}.${column}`] = `${model.alias}.${column}`
         }
      }
      return {
         select: _selects,
         where: _wheres,
         joins: _joins,
         groupBy: _groupBy,
      }
   }

   build() {
      const buildWhere = this.buildWhere(this.args, this.model)
      const buildSelect = this.buildSelect(this.args, this.model)
      let sql = `SELECT ${buildSelect.select.length ? buildSelect.select.join(', ') : "*"} 
      FROM ${this.model.table} ${this.model.alias} 
      ${buildWhere.joins.length ? Object.values(buildWhere.joins).join(" ") : ""} 
      ${buildSelect.joins.length ? Object.values(buildSelect.joins).join(" ") : ""} 
      WHERE ${buildWhere.where.length ? buildWhere.where.join(" AND ") : "1=1"}`
      if (this.args.limit) {
         sql += ` LIMIT ${this.args.limit.take || 0} OFFSET ${this.args.limit.skip || 0}`
      }
      if (this.args.orderBy) {
         const orderBy = this.getOrderByFields(this.args.orderBy, this.model)
         sql += ` ORDER BY ${orderBy.join(", ")}`
      }

      // group by
      sql += ` GROUP BY ${Object.values(buildSelect.groupBy).join(", ")}`
      console.log(sql);
      return sql


   }


}

export default buildFindArgs