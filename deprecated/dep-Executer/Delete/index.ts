import Model from "../.."
import WhereArgs from "../../Args/WhereArgs"
import { DeleteArgsType } from "../../types"
import RelationExecuteArgs from "../../Args/RelationExcuteArgs"
import Foreign from "../../../core/classes/ForeignInfo"
import XqlFile from "../../../xt/fields/File"
import { chunkArray } from "../../../utils/chunker"
import XansqlError from "../../../core/XansqlError"
import { iof } from "../../../utils"
import { ModelType } from "../../../core/types"
import XqlArray from "../../../xt/fields/Array"

class DeleteExecuter {
   constructor(readonly model: ModelType) {
   }

   async execute(args: DeleteArgsType) {
      const xansql = this.model.xansql
      const model = this.model
      if (!args.where || !Object.keys(args.where).length) {
         throw new XansqlError({
            message: `Delete operation on model ${model.table} requires a WHERE clause to prevent accidental deletion of all records.`,
            model: model.table
         })
      }

      const file_columns_select: any = {}
      for (let column in model.schema) {
         const field = model.schema[column]
         if (iof(field, XqlFile)) {
            file_columns_select[column] = true
         }
      }

      const results = await model.find({
         where: args.where,
         limit: "all",
         select: {
            [model.IDColumn]: true,
            ...file_columns_select,
            ...(args.select || {})
         } as any
      }) as any

      if (!results?.length) {
         return []
      }


      for (let column in model.schema) {
         const field = model.schema[column]
         if (iof(field, XqlFile)) {
            for (let { chunk } of chunkArray(results)) {
               for (let row of chunk) {
                  const filemeta = row[column]
                  if (filemeta) {
                     await xansql.deleteFile(filemeta.fileId)
                  }
               }
            }
         } else if (Foreign.isArray(field)) {
            const schemaType = (field as XqlArray<any>).type
            const meta = schemaType.meta || {}
            const foreign = Foreign.get(model, column)
            const FModel = model.xansql.getModel(foreign.table)
            if (meta.nullable) {
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
      await model.execute(sql)
      return results
   }
}

export default DeleteExecuter