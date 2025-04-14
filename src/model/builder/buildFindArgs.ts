import Model from ".."
import Relation from "../../schema/core/Relation"
import { isObject } from "../../utils"
import { FindArgs, GetRelationType } from "../type"


type RelationFactory = {
   [column: string]: buildFindArgs
}


class buildFindArgs {
   private model: Model
   private args: FindArgs

   private relations: RelationFactory = {}
   private where: string[] = []
   private select: string[] = []
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
            const builder = new buildFindArgs(foreginModel, newargs)
            builder.relation = relation
            this.relations[column] = builder
         } else {
            if (isObject(value)) {

            } else {
               this.where.push(`${model.alias}.${column} = ${value}`)
            }
         }
      }
   }

   buildJoin() {
      let joins = ""
      for (let column in this.relations) {
         const builder = this.relations[column]
         const relation = builder.relation as GetRelationType
         joins += ` JOIN ${relation.foregin.table} ${relation.foregin.alias} ON ${relation.main.alias}.${relation.main.column} = ${relation.foregin.alias}.${relation.foregin.column}`
         joins += builder.buildJoin()
      }
      return joins
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

      sql += this.buildJoin()

      console.log(sql);

      return sql
   }

   private getRelation(table: string, column: string) {
      const model = this.model.xansql.getModel(table)
      if (!model) throw new Error(`Invalid table name ${table}`)
      const schema = model.schema.get()
      const foregin = schema[column]

      if (!(foregin instanceof Relation)) throw new Error(`Invalid relation column ${table}.${column}`)

      let single = false

      if (!foregin.table) {
         const reference: any = schema[foregin.column]
         foregin.table = reference.constraints.references.table
         foregin.column = reference.constraints.references.column
         single = true
      }

      if (!foregin.table) throw new Error(`Invalid relation table name ${table}`)
      if (!foregin.column) throw new Error(`Invalid relation column name ${table}`)

      return {
         single,
         main: {
            table,
            column,
            alias: model.alias,
         },
         foregin: {
            table: foregin.table,
            column: foregin.column,
            alias: this.model.xansql.getModel(foregin.table).alias,
         }
      }
   }

}

export default buildFindArgs