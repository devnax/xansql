import Schema from ".."
import DataArgs from "../Args/DataArgs"
import SelectArgs from "../Args/SelectArgs"
import { UpdateArgsType } from "../type"


class UpdateExcuter {
   model: Schema
   constructor(model: Schema) {
      this.model = model
   }

   async excute(args: UpdateArgsType) {
      const xansql = this.model.xansql
      const model = this.model
      const dataArgs = (new DataArgs(model, args.data, "update")).values

      // only for validation
      if (args.select) {
         new SelectArgs(model, args.select || {})
      }

      let results = []

      for (let arg of dataArgs) {
         const sql = `UPDATE ${model.table} SET ${arg.sql}`
      }


      return dataArgs
   }

}

export default UpdateExcuter