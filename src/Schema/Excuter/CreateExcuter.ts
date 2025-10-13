import Schema from ".."
import DataArgs from "../Args/DataArgs"
import SelectArgs from "../Args/SelectArgs"
import { CreateArgsType } from "../type"


class CreateExcuter {
   model: Schema
   constructor(model: Schema) {
      this.model = model
   }
   async excute(args: CreateArgsType) {
      const xansql = this.model.xansql
      const model = this.model
      const dataArgs = (new DataArgs(model, args.data, "create")).values

      // only for validation
      if (args.select) {
         new SelectArgs(model, args.select || {})
      }

      const insertIds = []
      let results = []

      for (let arg of dataArgs) {
         const sql = `INSERT INTO ${model.table} ${arg.sql}`
         const { insertId } = await model.excute(sql)
         if (insertId) {
            insertIds.push(insertId)
            results.push({ [model.IDColumn]: insertId })

            // excute relations
            for (let rel_column in arg.relations) {
               const relInfo = arg.relations[rel_column]
               const foreign = relInfo.foreign
               const FModel = xansql.getModel(foreign.table)
               for (let relData of relInfo.data) {
                  const fdata = {
                     ...relData,
                     [foreign.column]: insertId
                  }
                  await FModel.create({
                     data: fdata,
                  })
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

export default CreateExcuter