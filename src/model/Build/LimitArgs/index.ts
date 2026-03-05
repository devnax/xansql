import Model from "../..";
import XansqlError from "../../../core/XansqlError";
import { LimitArgs } from "../../types";

class BuildLimitArgs {
   readonly sql
   readonly take: number = 0
   readonly skip: number = 0

   constructor(args: LimitArgs, model: Model<any>) {

      let take = args?.take ?? 0
      let skip = args.skip ?? 0

      if (take < 0 || !Number.isInteger(take)) {
         throw new XansqlError({
            code: "QUERY_ERROR",
            message: `Invalid take value in limit clause`,
            model: model.table
         })
      }
      if (skip < 0 || !Number.isInteger(skip)) {
         throw new XansqlError({
            code: "QUERY_ERROR",
            message: `Invalid skip value in limit clause`,
            model: model.table
         })
      }

      this.take = take
      this.skip = skip
      this.sql = take ? `LIMIT ${take} ${skip ? `OFFSET ${skip} ` : ""}`.trim() : ""
   }

}

export default BuildLimitArgs 