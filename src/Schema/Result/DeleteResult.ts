import Schema from "..";
import { ForeignInfo } from "../../type";
import { DeleteArgs } from "../type";
import FindResult from "./FindResult";
import WhereArgs from "./WhereArgs";

class DeleteResult {
   finder: FindResult
   model: Schema
   constructor(model: Schema) {
      this.model = model
      this.finder = new FindResult(model)
   }

   async result(args: DeleteArgs) {
      const model = this.model
      const xansql = model.xansql
      const where = new WhereArgs(model, args.where || {})
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
               [model.IDColumn]: true
            }
         })
      }

      const items = await this.finder.result({
         where: args.where,
         select: {
            [model.IDColumn]: true
         }
      })

      const ids = items.map((i: any) => i[model.IDColumn])

      for (let column in model.schema) {
         const field = model.schema[column]
         if (xansql.isForeignArray(field)) {
            let foreign = xansql.foreignInfo(model.table, column) as ForeignInfo
            let FModel = xansql.getModel(foreign.table)
            if (!FModel) {
               throw new Error(`Foreign model ${foreign.table} not found for ${model.table}.${column}`)
            }

            const r = new DeleteResult(FModel)
            await r.result({
               where: {
                  [foreign.column]: {
                     [foreign.relation.target]: {
                        in: ids
                     }
                  }
               }
            })
         }
      }

      let sql = `DELETE FROM ${model.table} ${where.sql}`
      await model.excute(sql)
      return results
   }
}

export default DeleteResult;