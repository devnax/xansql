import Model from "../.."
import { isArray } from "../../../utils"
import WhereArgs from "../../Args/WhereArgs"
import { UpdateArgsType } from "../../type"
import RelationExecuteArgs from "../../Args/RelationExcuteArgs"
import UpdateDataArgs from "./UpdateDataArgs"
import { chunkArray } from "../../../utils/chunker"
import ExecuteMeta from "../../../core/ExcuteMeta"


class UpdateExecuter {
   model: Model
   constructor(model: Model) {
      this.model = model
   }

   async execute(args: UpdateArgsType) {
      const xansql = this.model.xansql
      const model = this.model
      const upArgs = new UpdateDataArgs(model, args.data)
      const isRelation = args instanceof RelationExecuteArgs

      if (Object.keys(args.where).length === 0) {
         throw new Error(`Where args is required for update operation in model ${model.table}`)
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
         })
      }

      try {

         if (existing_file_rows.length > 0) {
            let executeId = undefined;
            if (typeof window !== "undefined") {
               executeId = ExecuteMeta.set({
                  model,
                  action: "UPLOAD_FILE",
                  modelType: isRelation ? "child" : "main",
                  args
               });
            }
            for (let file_col of fileColumns) {
               const filemeta = await xansql.uploadFile(upArgs.files[file_col], executeId)
               uploadedFileIds.push(filemeta.fileId)
               upArgs.data[file_col] = `'${JSON.stringify(filemeta)}'`
            }
         }
         let executeId = undefined;
         if (typeof window !== "undefined") {
            executeId = ExecuteMeta.set({
               model,
               action: "UPDATE",
               modelType: isRelation ? "child" : "main",
               args
            });
         }
         const keys = Object.keys(upArgs.data)
         let upsql = keys.map(col => `${col} = ${upArgs.data[col]}`).join(", ")
         let sql = `UPDATE ${model.table} SET ${upsql} ${Where.sql}`.trim()
         let update = await xansql.execute(sql, executeId)

         if (existing_file_rows.length > 0) {
            let executeId = undefined;
            if (typeof window !== "undefined") {
               executeId = ExecuteMeta.set({
                  model,
                  action: "DELETE_FILE",
                  modelType: isRelation ? "child" : "main",
                  args
               });
            }
            for (let row of existing_file_rows) {
               for (let file_col of fileColumns) {
                  const oldFileMeta = row[file_col]
                  if (oldFileMeta) {
                     await xansql.deleteFile(oldFileMeta.fileId, executeId)
                  }
               }
            }
         }

         if (!update.affectedRows) {
            return []
         }
      } catch (error) {
         // rollback uploaded files
         let executeId = undefined;
         if (typeof window !== "undefined") {
            executeId = ExecuteMeta.set({
               model,
               action: "UPDATE",
               modelType: isRelation ? "child" : "main",
               args
            });
         }
         for (let fileId of uploadedFileIds) {
            await xansql.deleteFile(fileId, executeId)
         }
         throw new Error("Error executing update: " + (error as Error).message);
      }


      const updated_rows = await model.find({
         where: args.where,
         limit: "all",
         select: {
            [model.IDColumn]: true
         }
      })

      if (updated_rows.length > 0) {
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
         if (relArgs.update) {
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
         if (relArgs.create) {
            for (let { chunk } of chunkArray(ids)) {
               for (let id of chunk) {
                  if (isArray(relArgs.create.data)) {
                     for (let item of relArgs.create.data) {
                        await FModel.create(new RelationExecuteArgs({
                           data: {
                              ...item,
                              [foreign.column]: id
                           }
                        }) as any)
                     }
                  } else {
                     await FModel.create(new RelationExecuteArgs({
                        data: {
                           ...relArgs.create.data,
                           [foreign.column]: id
                        }
                     }) as any)
                  }
               }
            }
         }

         // handle upsert
         if (relArgs.upsert) {
            for (let { chunk } of chunkArray(ids)) {
               const has = await FModel.count({
                  where: {
                     ...relArgs.upsert.where,
                     [foreign.column]: {
                        in: chunk
                     }
                  },
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

      if (args.select) {
         const results: any[] = []
         for (let { chunk } of chunkArray(ids)) {
            const res = await model.find({
               where: {
                  [model.IDColumn]: {
                     in: chunk
                  }
               },
               limit: "all",
               select: args.select
            })
            results.concat(res)
         }
      }

      return updated_rows
   }

}

export default UpdateExecuter