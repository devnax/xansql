import Schema from "../.."
import CreateDataArgs from "./CreateDataArgs"
import { CreateArgsType } from "../../type"
import SelectArgs from "../Find/SelectArgs"
import { chunkArray } from "../../../utils/chunker"
import RelationExecuteArgs from "../../Args/RelationExcuteArgs"
import { chunkFile, countFileChunks } from "../../../utils/file"
import { XansqlFileMeta } from "../../../core/type"


class CreateExecuter {
   model: Schema
   constructor(model: Schema) {
      this.model = model
   }
   async execute(args: CreateArgsType) {
      const xansql = this.model.xansql
      const model = this.model
      const dataArgs = (new CreateDataArgs(model, args.data)).values

      // only for validation
      if (args.select) new SelectArgs(model, args.select || {})

      const insertIds = []
      let results = []

      for (let { chunk } of chunkArray(dataArgs)) {
         for (let arg of chunk) {
            let insertId
            const fileColumns = Object.keys(arg.files)
            const uploadedFileNames: string[] = []
            try {
               if (fileColumns.length > 0) {
                  for (let file_col of fileColumns) {
                     const filemeta = await xansql.uploadFile(arg.files[file_col])
                     uploadedFileNames.push(filemeta.name)
                     arg.data[file_col] = `'${JSON.stringify(filemeta)}'`
                  }
               }
               const keys = Object.keys(arg.data)
               const sql = `INSERT INTO ${model.table} (${keys.join(", ")}) VALUES (${keys.map(k => arg.data[k]).join(", ")})`
               const created = await xansql.execute(sql)
               insertId = created.insertId
            } catch (error: any) {
               if (fileColumns.length > 0) {
                  for (let filename of uploadedFileNames) {
                     await xansql.deleteFile(filename)
                  }
                  throw new Error(`Error inserting into table ${model.table}: ${error.message}`);
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
         const findArgs: any = {
            where: {
               [model.IDColumn]: insertIds.length === 1 ? insertIds[0] : { in: insertIds }
            },
            select: args.select
         }
         results = await model.find(findArgs)
      }

      return results
   }

}

export default CreateExecuter