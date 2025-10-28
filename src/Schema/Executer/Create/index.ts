import Schema from "../.."
import CreateDataArgs from "./CreateDataArgs"
import { CreateArgsType } from "../../type"
import SelectArgs from "../Find/SelectArgs"
import RelationExecuteArgs from "../RelationExcuteArgs"
import { chunkArray } from "../../../utils/chunker"


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
      if (args.select) {
         new SelectArgs(model, args.select || {})
      }
      const insertIds = []
      let results = []

      for (let { chunk } of chunkArray(dataArgs)) {
         for (let arg of chunk) {
            const sql = `INSERT INTO ${model.table} ${arg.sql}`
            const { insertId } = await model.execute(sql)
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