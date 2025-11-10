import Schema from "../.."
import WhereArgs from "../../Args/WhereArgs"
import { DeleteArgsType } from "../../type"
import RelationExecuteArgs from "../../Args/RelationExcuteArgs"
import Foreign from "../../../core/classes/ForeignInfo"
import XqlFile from "../../../Types/fields/File"
import { XqlFields } from "../../../Types/types"


class DeleteExecuter {
   model: Schema
   constructor(model: Schema) {
      this.model = model
   }

   async execute(args: DeleteArgsType) {
      const xansql = this.model.xansql
      const model = this.model
      if (!args.where || Object.keys(args.where).length === 0) {
         throw new Error(`Where args is required for delete operation in model ${model.table}`)
      }


      let findArgs: any = {
         where: args.where,
         select: {
            [model.IDColumn]: true,
            ...(args.select || {})
         }
      }

      let fileColumns: string[] = []
      let foreignFields: { [col: string]: XqlFields } = {}
      for (let column in model.schema) {
         const field = model.schema[column]
         if (field instanceof XqlFile) {
            findArgs.select[column] = true
            fileColumns.push(column)
         }

         if (Foreign.isArray(field)) {
            foreignFields[column] = field
         }
      }

      const results = await model.find(findArgs)
      if (!results?.length) {
         return null
      }

      for (let column in foreignFields) {
         const field = foreignFields[column]
         const meta = field.meta || {}
         const foreign = Foreign.get(model, column)
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

      const Where = new WhereArgs(model, args.where)
      const sql = `DELETE FROM ${model.table} ${Where.sql}`.trim()
      const { affectedRows } = await xansql.execute(sql)

      // delete files
      for (let row of results) {
         for (let file_col of fileColumns) {
            const filename = row[file_col]
            if (filename) {
               await xansql.deleteFile(filename)
            }
         }
      }

      return args.select ? results : !!affectedRows
   }
}

export default DeleteExecuter