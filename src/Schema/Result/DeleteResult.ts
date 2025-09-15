import Schema from "..";
import { ForeignInfo } from "../../type";
import { DeleteArgs } from "../type";
import FindResult from "./FindResult";
import UpdateResult from "./UpdateResult";
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
      let select = args.select || {}
      if (!(model.IDColumn in select)) {
         select[model.IDColumn] = true
      }

      let results = await this.finder.result({
         where: args.where,
         select: args.select
      })

      const ids = results.map((i: any) => i[model.IDColumn])

      let sql = `DELETE FROM ${model.table} ${where.sql}`
      const r = await model.excute(sql)
      if (r.affectedRows) {
         for (let column in model.schema) {
            const field = model.schema[column]
            if (xansql.isForeignArray(field)) {
               let foreign = xansql.foreignInfo(model.table, column) as ForeignInfo
               let FModel = xansql.getModel(foreign.table)
               if (!FModel) {
                  throw new Error(`Foreign model ${foreign.table} not found for ${model.table}.${column}`)
               }

               // is optional relation
               const meta: any = FModel.schema[foreign.column]?.meta || {}
               if (meta.optional || meta.nullable) {

                  // set to null
                  const r = new UpdateResult(FModel)
                  const res = await r.result({
                     data: {
                        [foreign.relation.main]: null
                     },
                     where: {
                        [foreign.column]: {
                           in: ids
                        }
                     }
                  })
               } else {
                  // delete all relation
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
         }
      }

      return results
   }
}

export default DeleteResult;