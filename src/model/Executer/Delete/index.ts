import Model from "../.."
import WhereArgs from "../../Args/WhereArgs"
import { DeleteArgsType, WhereArgsType } from "../../types"
import RelationExecuteArgs from "../../Args/RelationExcuteArgs"
import Foreign from "../../../core/classes/ForeignInfo"
import XqlFile from "../../../xt/fields/File"
import { XqlFields } from "../../../xt/types"
import { chunkArray } from "../../../utils/chunker"
import XansqlError from "../../../core/XansqlError"
import { iof } from "../../../utils"


class DeleteExecuter {
   model: Model
   constructor(model: Model) {
      this.model = model
   }

   async execute(args: DeleteArgsType) {
      const xansql = this.model.xansql
      const model = this.model
      if (!args.where || Object.keys(args.where).length === 0) {
         throw new XansqlError({
            message: `Delete operation on model ${model.table} requires a WHERE clause to prevent accidental deletion of all records.`,
            model: model.table
         })
      }

      let fileColumns: string[] = []
      let foreignFields: { [col: string]: XqlFields } = {}

      for (let column in model.schema) {
         const field = model.schema[column]
         if (iof(field, XqlFile)) {
            fileColumns.push(column)
         }

         if (Foreign.isArray(field)) {
            foreignFields[column] = field
         }
      }

      const results = await model.find({
         where: args.where,
         limit: "all",
         select: {
            [model.IDColumn]: true,
            ...(args.select || {})
         }
      })

      if (results.length === 0) {
         return []
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

      let fileRows: any[] = []
      if (fileColumns.length) {
         let fileWhere: WhereArgsType = [
            ...fileColumns.map(col => ({ [col]: { isNotNull: true } }))
         ]
         if (Array.isArray(args.where)) {
            fileWhere = [...args.where, ...fileWhere]
         } else {
            fileWhere = [args.where, ...fileWhere]
         }

         fileRows = await model.find({
            where: fileWhere,
            limit: "all",
            select: fileColumns.reduce((acc, col) => {
               acc[col] = true
               return acc
            }, {} as any)
         })
      }

      const Where = new WhereArgs(model, args.where)
      const sql = `DELETE FROM ${model.table} ${Where.sql}`.trim()
      const { affectedRows } = await model.execute(sql)
      if (!affectedRows || affectedRows === 0) {
         return []
      }

      // delete files
      if (fileColumns.length && fileRows.length) {
         for (let { chunk } of chunkArray(fileRows)) {
            for (let row of chunk) {
               for (let file_col of fileColumns) {
                  const filemeta = row[file_col]
                  if (filemeta) {
                     await xansql.deleteFile(filemeta.fileId)
                  }
               }
            }
         }
      }

      return results
   }
}

export default DeleteExecuter