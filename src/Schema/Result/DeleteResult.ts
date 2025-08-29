import Schema from "..";
import BuildWhere from "../Query/BuildWhere";
import { DeleteArgs } from "../type";
import FindResult from "./FindResult";

class DeleteResult {
   finder: FindResult
   constructor(readonly schema: Schema) {
      this.finder = new FindResult(schema)
   }

   async result(args: DeleteArgs) {
      const schema = this.schema
      const where = BuildWhere(args.where || {}, schema)
      let results: any;
      if (args.select) {
         results = await this.finder.result({
            where: args.where,
            select: args.select
         })
      } else {
         results = await this.finder.result({
            where: args.where,
            select: {
               [schema.IDColumn]: true
            }
         })
      }
      await schema.excute(`DELETE FROM ${schema.table} ${where.sql}`)
      return results
   }
}

export default DeleteResult;