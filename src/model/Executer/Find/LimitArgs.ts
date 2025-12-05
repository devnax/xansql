import Model from "../..";
import XansqlError from "../../../core/XansqlError";
import { LimitArgsType } from "../../types";

class LimitArgs {
   readonly take: number;
   readonly skip: number;

   /**
    * SQL representation of the limit clause
    * format: LIMIT take OFFSET skip
    */
   readonly sql: string;

   constructor(model: Model, args: LimitArgsType) {
      const xansql = model.xansql
      const maxLimit = xansql.config.maxLimit.find
      if (args === "all") {
         this.take = 10000000 // set a very high limit for "all"
         this.skip = 0
         this.sql = ``
      } else {
         let take = args.take ?? maxLimit
         let skip = args.skip ?? 0
         if (take < 0 || !Number.isInteger(take)) {
            throw new XansqlError({
               message: `Invalid take value in limit clause for model ${model.table}`,
               model: model.table
            })
         }
         if (skip < 0 || !Number.isInteger(skip)) {
            throw new XansqlError({
               message: `Invalid skip value in limit clause for model ${model.table}`,
               model: model.table
            })
         }

         this.take = take
         this.skip = skip
         this.sql = `LIMIT ${take} ${skip ? `OFFSET ${skip} ` : ""}`.trim()
      }
   }
}
export default LimitArgs;
