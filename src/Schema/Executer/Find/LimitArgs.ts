import Schema from "../..";
import { LimitArgsType } from "../../type";

class LimitArgs {
   readonly take: number;
   readonly skip: number;

   /**
    * SQL representation of the limit clause
    * format: LIMIT take OFFSET skip
    */
   readonly sql: string;

   constructor(model: Schema, args: LimitArgsType) {
      const xansql = model.xansql
      const maxLimit = xansql.config.maxLimit.find
      let take = args.take ?? maxLimit
      let skip = args.skip ?? 0
      if (take < 0 || !Number.isInteger(take)) {
         throw new Error(`Invalid take value in limit clause in model ${model.table}`)
      }
      if (skip < 0 || !Number.isInteger(skip)) {
         throw new Error(`Invalid skip value in limit clause in model ${model.table}`)
      }

      this.take = take
      this.skip = skip
      this.sql = `LIMIT ${take} ${skip ? `OFFSET ${skip} ` : ""}`.trim()

   }
}
export default LimitArgs;
