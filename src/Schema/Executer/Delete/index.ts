import Schema from "../.."
import WhereArgs from "../../Args/WhereArgs"
import Foreign from "../../include/Foreign"
import { DeleteArgsType } from "../../type"
import RelationExecuteArgs from "../RelationExcuteArgs"

class DeleteExecuter {
   model: Schema
   constructor(model: Schema) {
      this.model = model
   }

   async execute(args: DeleteArgsType) {
      const model = this.model
      const xansql = this.model.xansql

      if (!args.where || Object.keys(args.where).length === 0) {
         throw new Error(`Where args is required for delete operation in model ${model.table}`)
      }

      const results = args.select ? await model.find({
         where: args.where,
         select: {
            [model.IDColumn]: true,
            ...(args.select || {})
         }
      }) : null

      if (!results?.length) {
         return null
      }

      for (let column in model.schema) {
         const field = model.schema[column]
         const meta = field.meta || {}

         if (Foreign.isArray(field)) {
            const foreign = Foreign.info(model, column)
            const FModel = model.xansql.getModel(foreign.table)
            if (meta.optional || meta.nullable) {
               // update foreign column to null
               await FModel.update(new RelationExecuteArgs({
                  data: { [foreign.column]: null },
                  where: { [foreign.column]: args.where }
               }) as any)
            } else {
               // delete all foreign rows
               await FModel.delete(new RelationExecuteArgs({
                  where: { [foreign.column]: args.where }
               }) as any)
            }
         }
      }

      const Where = new WhereArgs(model, args.where)
      const sql = `DELETE FROM ${model.table} ${Where.sql}`.trim()
      const { affectedRows } = await model.execute(sql)
      return args.select ? results : !!affectedRows
   }
}

export default DeleteExecuter