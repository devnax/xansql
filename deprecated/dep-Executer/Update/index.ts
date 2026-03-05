import Model from "../.."
import WhereArgs from "../../Args/WhereArgs"
import { UpdateArgsType } from "../../types"
import RelationExecuteArgs from "../../Args/RelationExcuteArgs"
import UpdateDataArgs from "./UpdateDataArgs"
import { chunkArray } from "../../../utils/chunker"
import XansqlError from "../../../core/XansqlError"
import { iof } from "../../../utils"
import { ModelType } from "../../../core/types"


class UpdateExecuter {
   model: ModelType
   constructor(model: ModelType) {
      this.model = model
   }

   async execute(args: UpdateArgsType) {
      const xansql = this.model.xansql
      const model = this.model
      const upArgs = new UpdateDataArgs(model, args.data)

      if (!Object.keys(args.where).length) {
         throw new XansqlError({
            message: `Update operation on model ${model.table} requires a WHERE clause to prevent accidental update of all records.`,
            model: model.table
         })
      }

      const Where = new WhereArgs(model, args.where)
      const fileColumns = Object.keys(upArgs.files)
      const uploadedFileIds: string[] = []

      let existing_file_rows: any[] = []
      if (fileColumns.length > 0) {
         existing_file_rows = await model.find({
            where: args.where,
            limit: "all",
            select: fileColumns.reduce((acc, col) => {
               acc[col] = true
               return acc
            }, {} as any)
         }) as any
      }

      try {
         if (existing_file_rows.length > 0) {
            for (let file_col of fileColumns) {
               if (iof(upArgs.files[file_col], File)) {
                  const filemeta = await xansql.uploadFile(upArgs.files[file_col])
                  if (filemeta?.fileId) {
                     uploadedFileIds.push(filemeta.fileId)
                     upArgs.data[file_col] = `'${JSON.stringify(filemeta)}'`
                  }
               }
            }
         }
         const keys = Object.keys(upArgs.data)
         let upsql = keys.map(col => `${col} = ${upArgs.data[col]}`).join(", ")
         let sql = `UPDATE ${model.table} SET ${upsql} ${Where.sql}`.trim()
         let update = await model.execute(sql)

         if (existing_file_rows.length > 0) {
            for (let row of existing_file_rows) {
               for (let file_col of fileColumns) {
                  const oldFileMeta = row[file_col]
                  if (oldFileMeta) {
                     await xansql.deleteFile(oldFileMeta.fileId)
                  }
               }
            }
         }

         if (!update?.affectedRows) {
            return []
         }
      } catch (error: any) {
         // rollback uploaded files
         for (let fileId of uploadedFileIds) {
            await xansql.deleteFile(fileId)
         }
         throw error
      }


      const updated_rows = await model.find({
         where: args.where,
         limit: "all",
         select: {
            [model.IDColumn]: true
         }
      })


      if (!updated_rows?.length) {
         return []
      }

      const ids = []
      for (let urow of updated_rows) {
         ids.push(urow[model.IDColumn])
      }

      for (let column in upArgs.relations) {
         const relation = upArgs.relations[column]
         const foreign = relation.foreign
         const FModel = xansql.getModel(foreign.table)
         const relArgs = relation.args

         // handle delete
         if (relArgs.delete) {
            for (let { chunk } of chunkArray(ids)) {
               await FModel.delete(new RelationExecuteArgs({
                  where: {
                     ...relArgs.delete.where,
                     [foreign.column]: {
                        in: chunk
                     }
                  }
               }) as any)
            }
         }

         // handle update
         if (relArgs.update && relArgs.update.data) {
            for (let { chunk } of chunkArray(ids)) {
               await FModel.update(new RelationExecuteArgs({
                  data: relArgs.update.data,
                  where: {
                     ...relArgs.update.where,
                     [foreign.column]: {
                        in: chunk
                     }
                  }
               }) as any)
            }
         }
         // handle create
         if (relArgs.create && relArgs.create.data) {
            for (let { chunk } of chunkArray(ids)) {
               for (let id of chunk) {
                  let data: any[] = relArgs.create.data as any
                  if (!Array.isArray(data)) {
                     data = [relArgs.create.data]
                  }
                  for (let item of data) {
                     await FModel.create(new RelationExecuteArgs({
                        data: {
                           ...item,
                           [foreign.column]: id
                        }
                     }) as any)
                  }
               }
            }
         }

         // handle upsert
         if (relArgs.upsert && relArgs.upsert.where && relArgs.upsert.create && relArgs.upsert.update) {
            for (let { chunk } of chunkArray(ids)) {

               const has = await FModel.count({
                  ...relArgs.upsert.where,
                  [foreign.column]: {
                     in: chunk
                  }
               })

               if (has) {
                  await FModel.update(new RelationExecuteArgs({
                     data: relArgs.upsert.update,
                     where: {
                        ...relArgs.upsert.where,
                        [foreign.column]: {
                           in: chunk
                        }
                     }
                  }) as any)
               } else {
                  for (let id of chunk) {
                     await FModel.create(new RelationExecuteArgs({
                        data: {
                           ...relArgs.upsert.create,
                           [foreign.column]: id
                        }
                     }) as any)
                  }
               }
            }
         }
      }

      if (args.select || args.aggregate) {
         let results: any[] = []
         for (let { chunk } of chunkArray(ids)) {
            const res = await model.find({
               where: {
                  [model.IDColumn]: {
                     in: chunk
                  }
               },
               limit: "all",
               select: args.select || {
                  [model.IDColumn]: true
               } as any,
               aggregate: args.aggregate || {},
               distinct: args.select ? undefined : [model.IDColumn],
               orderBy: args.orderBy || {}
            })

            results = results.concat(res)
         }

         return results
      }

      return updated_rows
   }

}

export default UpdateExecuter