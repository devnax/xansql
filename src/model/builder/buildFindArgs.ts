import Model from ".."
import Relation from "../../schema/core/Relation"
import { FindArgs } from "../../type"
import { isObject } from "../../utils"


type RelationFactory = {
   [column: string]: buildFindArgs
}


class buildFindArgs {
   private model: Model
   private args: FindArgs

   private relations: RelationFactory = {}
   private where: string[] = []


   constructor(model: Model, args: FindArgs) {
      this.model = model
      this.args = args

      if (!args.where) {
         throw new Error(`Where condition is required`)
      }
      const schema = model.schema()

      for (let column in args.where) {
         const value = args.where[column]
         const schemaValue = schema[column]
         if (schemaValue instanceof Relation) {
            const relation = this.getRelation(model.table, column)
            const foregin = model.xansql.getModel(relation.main.table)
            this.relations[column] = new buildFindArgs(foregin, value as FindArgs)
         } else {
            if (isObject(value)) {

            } else {
               this.where.push(`${model.alias}.${column} = ${value}`)
            }
         }
      }
   }

   private getRelation(table: string, column: string) {
      const model = this.model.xansql.getModel(table)
      if (!model) throw new Error(`Invalid table name ${table}`)
      const schema = model.schema()
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

   private buildRelation() {
      let join: string[] = []

      for (let column in this.relations) {
         const buildArgs = this.relations[column]
         const relation = this.getRelation(buildArgs.model.table, column)
         join.push(`JOIN ${relation.foregin.table} ${relation.foregin.alias} ON ${relation.main.alias}.${relation.main.column} = ${relation.foregin.alias}.${relation.foregin.column}`);

         if (buildArgs.relations) {
            join = [
               ...join,
               ...buildArgs.buildRelation()
            ]
         }
      }
      return join
   }
   private buildWhere() {
      const where = this.where.join(' AND ')
      return where ? `WHERE ${where}` : ''
   }
   private buildSelect() {
      const select = this.args.select ? this.args.select.map(f => `${this.model.alias}.${f}`).join(',') : '*'
      return select
   }
   // private buildOrderBy() {
   //    const orderBy = this.args.orderBy ? this.args.orderBy.map(f => `${this.model.alias}.${f}`).join(',') : ''
   //    return orderBy ? `ORDER BY ${orderBy}` : ''
   // }

   build() {
      const join = this.buildRelation()
      const select = this.buildSelect()
      const where = this.buildWhere()
      // const orderBy = this.buildOrderBy()
      const limit = this.args.take ? `LIMIT ${this.args.take}` : ''
      const offset = this.args.skip ? `OFFSET ${this.args.skip}` : ''

      let query = `SELECT ${select} FROM ${this.model.table} ${this.model.alias} ${where}  ${limit} ${offset}`
      return join.length ? `${query} ${join.join(' ')}` : query
   }
}

export default buildFindArgs