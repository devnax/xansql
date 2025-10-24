import Schema from "../.."
import WhereArgs from "../../Args/WhereArgs"
import Foreign from "../../include/Foreign"
import { DeleteArgsType } from "../../type"

class DeleteExecuter {
   model: Schema
   constructor(model: Schema) {
      this.model = model
   }

   async execute(args: DeleteArgsType) {
      const model = this.model

      if (!args.where || Object.keys(args.where).length === 0) {
         throw new Error(`Where args is required for delete operation in model ${model.table}`)
      }

      if (model.options?.hooks && model.options.hooks.beforeDelete) {
         args = await model.options.hooks.beforeDelete(args) || args
      }

      const results = args.select ? await model.find({
         where: args.where,
         select: {
            [model.IDColumn]: true,
            ...(args.select || {})
         }
      }) : null

      for (let column in model.schema) {
         const field = model.schema[column]
         const meta = field.meta || {}

         if (Foreign.isArray(field)) {
            const foreign = Foreign.info(model, column)
            const FModel = model.xansql.getModel(foreign.table)
            if (meta.optional || meta.nullable) {
               // update foreign column to null
               await FModel.update({
                  data: { [foreign.column]: null },
                  where: { [foreign.column]: args.where }
               })
            } else {
               // delete all foreign rows
               await FModel.delete({
                  where: { [foreign.column]: args.where }
               })
            }
         }
      }

      const Where = new WhereArgs(model, args.where)
      const sql = `DELETE FROM ${model.table} ${Where.sql}`.trim()
      const { affectedRows } = await model.execute(sql)

      const r = args.select ? results : !!affectedRows
      if (model.options?.hooks && model.options.hooks.afterDelete) {
         return await model.options.hooks.afterDelete(r, args) || r
      }
      return r
   }
}

export default DeleteExecuter