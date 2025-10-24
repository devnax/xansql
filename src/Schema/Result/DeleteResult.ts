import Schema from "..";
import { chunkArray } from "../../utils/chunker";
import WhereArgs from "../Args/WhereArgs";
import Foreign from "../include/Foreign";
import { DeleteArgs } from "../type";
import FindResult from "./FindResult";
import UpdateResult from "./UpdateResult";

class DeleteResult {
   finder: FindResult
   model: Schema
   constructor(model: Schema) {
      this.model = model
      this.finder = new FindResult(model)
   }

   async result(args: DeleteArgs) {
      // hooks beforeDelete
      if (this.model.options.hooks?.beforeDelete) {
         const res = await this.model.options.hooks.beforeDelete(args.where)
         args.where = res
      }

      const model = this.model
      const xansql = model.xansql
      const maxLimit = xansql.config.maxLimit.delete
      if (!args.where || Object.keys(args.where).length === 0) {
         throw new Error(`Delete operation requires a valid where clause to prevent mass deletions in ${model.table} model.`);
      }

      const where = new WhereArgs(model, args.where || {})
      let select = args.select || {}
      if (!(model.IDColumn in select)) {
         select[model.IDColumn] = true
      }

      const count = await this.model.count({ where: args.where })
      if (count === 0) return []

      if (count > maxLimit) {
         throw new Error(`Delete operation exceeds the maximum limit of ${maxLimit} rows in ${model.table} model. Found ${count} rows matching the where clause.`);
      }

      let results = await this.finder.result({
         where: args.where,
         select: args.select
      })


      let allids: number[] = []
      for (let { chunk } of chunkArray(results)) {
         const ids = chunk.map((i: any) => i[model.IDColumn])
         allids = allids.concat(ids)
         let sql = `DELETE FROM ${model.table} ${where.sql}`
         const r = await model.execute(sql)
         if (r.affectedRows) {
            await this.deleteRelations(ids)
         }
      }

      // hooks afterDelete
      if (this.model.options.hooks?.afterDelete) {
         const res = await this.model.options.hooks.afterDelete(results, args.where)
         results = res
      }

      return results
   }

   async deleteRelations(ids: any[]) {
      const model = this.model
      const xansql = model.xansql
      for (let column in model.schema) {
         const field = model.schema[column]
         if (Foreign.isArray(field)) {
            let foreign = Foreign.info(model, column)
            let FModel = xansql.getModel(foreign.table)
            if (!FModel) {
               throw new Error(`Foreign model ${foreign.table} not found for ${model.table}.${column}`)
            }

            // is optional relation
            const meta: any = FModel.schema[foreign.column]?.meta || {}
            if (meta.optional || meta.nullable) {
               // set to null
               const r = new UpdateResult(FModel)
               await r.result({
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
}

export default DeleteResult;