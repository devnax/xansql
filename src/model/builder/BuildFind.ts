import Model from ".."
import Relation from "../../schema/core/Relation"
import { FindArgs } from "../type"

class BuilFind {
   model: Model
   args: FindArgs
   constructor(model: Model, args: FindArgs) {
      this.model = model
      this.args = args
   }

   private buildSelect(args: FindArgs, model: Model, usesAliases: { [key: string]: number } = {}, asCol = true) {
      const schema = model.schema.get()

      let alias = `${model.alias + (usesAliases[model.alias] || "")}`
      usesAliases[model.alias] = (usesAliases[model.alias] || 0) + 1

      const info = {
         alias,
         fields: [] as string[],
         joins: {} as { [alias: string]: string },
      }

      let fields: string[] = []
      for (let column in args.select) {
         const value = args.select[column]
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

            const build = this.buildSelect(newargs, foreginModel, usesAliases, false)
            let formatedFields = []
            for (let col of build.fields) {
               if (col.startsWith("(") || col.startsWith("'")) {
                  formatedFields.push(col)
               } else {
                  formatedFields.push(`'${col.split('.')[1]}', ${col}`)
               }
            }
            let sql = `(
               SELECT JSON_ARRAYAGG(
                  JSON_OBJECT(
                     ${formatedFields.join(", ")}
                  )
               )
               FROM ${foreginModel.table} ${build.alias}
               WHERE ${relation.foregin.alias}.${relation.foregin.column} = ${relation.main.alias}.${relation.main.column}
            )`

            if (asCol) {
               sql = `${sql} AS ${column}`
            } else {
               sql = `'${column}', ${sql}`
            }
            fields.push(sql)
         } else {
            fields.push(`${alias}.${column}`)
         }
      }

      return info
   }

   private buildWhere() {

   }

   build() {


      const select = this.buildSelect(this.args, this.model)
      let sql = `SELECT ${select.fields.join(", ")} FROM ${this.model.table} ${select.alias};`
      console.log(sql);

   }

}

export default BuilFind