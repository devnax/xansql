import Model from "../.."
import CreateDataArgs from "./CreateDataArgs"
import { CreateArgsType } from "../../type"
import SelectArgs from "../Find/SelectArgs"
import { chunkArray } from "../../../utils/chunker"
import RelationExecuteArgs from "../../Args/RelationExcuteArgs"
import ExecuteMeta from "../../../core/ExcuteMeta"

class CreateExecuter {
   model: Model
   constructor(model: Model) {
      this.model = model
   }
   async execute(args: CreateArgsType) {
      const xansql = this.model.xansql
      const model = this.model
      const createArgs = new CreateDataArgs(model, args.data)
      const isRelation = args instanceof RelationExecuteArgs

      // only for validation
      if (args.select) new SelectArgs(model, args.select || {})

      const insertIds = []
      let results = []

      for (let { chunk } of chunkArray(createArgs.values)) {
         for (let arg of chunk) {
            let insertId
            const fileColumns = Object.keys(arg.files)
            const uploadedFileIds: string[] = []
            try {

               if (fileColumns.length > 0) {
                  let executeId = undefined;
                  if (typeof window !== "undefined") {
                     executeId = ExecuteMeta.set({
                        model,
                        action: "UPLOAD_FILE",
                        modelType: isRelation ? "child" : "main",
                        args: arg
                     });
                  }
                  for (let file_col of fileColumns) {
                     const filemeta = await xansql.uploadFile(arg.files[file_col], executeId)
                     uploadedFileIds.push(filemeta.fileId)
                     arg.data[file_col] = `'${JSON.stringify(filemeta)}'`
                  }
               }
               let executeId = undefined;
               if (typeof window !== "undefined") {
                  executeId = ExecuteMeta.set({
                     model,
                     action: "INSERT",
                     modelType: isRelation ? "child" : "main",
                     args: arg
                  });
               }
               const keys = Object.keys(arg.data)
               const sql = `INSERT INTO ${model.table} (${keys.join(", ")}) VALUES (${keys.map(k => arg.data[k]).join(", ")})`
               const created = await xansql.execute(sql, executeId)
               insertId = created.insertId
            } catch (error: any) {
               if (fileColumns.length > 0) {
                  let executeId = undefined;
                  if (typeof window !== "undefined") {
                     executeId = ExecuteMeta.set({
                        model,
                        action: "DELETE_FILE",
                        modelType: isRelation ? "child" : "main",
                        args: arg
                     });
                  }
                  for (let fileId of uploadedFileIds) {
                     try {
                        await xansql.deleteFile(fileId, executeId)
                     } catch (error) {
                     }
                  }
                  throw error
               }
            }
            if (insertId) {
               insertIds.push(insertId)
               results.push({ [model.IDColumn]: insertId })

               // execute relations
               for (let rel_column in arg.relations) {
                  const relInfo = arg.relations[rel_column]
                  const foreign = relInfo.foreign
                  const FModel = xansql.getModel(foreign.table)
                  for (let relData of relInfo.data) {
                     const fdata = {
                        ...relData,
                        [foreign.column]: insertId
                     }
                     const rargs = new RelationExecuteArgs({
                        data: fdata
                     })
                     await FModel.create(rargs as any)
                  }
               }
            }
         }
      }

      if (args.select) {
         results = await model.find({
            where: {
               [model.IDColumn]: insertIds.length === 1 ? insertIds[0] : { in: insertIds }
            },
            limit: "all",
            select: args.select
         })
      }

      return results
   }

}

export default CreateExecuter