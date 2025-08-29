import Schema from "..";
import { LimitArgs } from "./types";


const BuildLimit = (args: LimitArgs, schema: Schema) => {

   let take = args.take ?? 50
   let skip = args.skip ?? 0
   if (take < 0 || !Number.isInteger(take)) {
      throw new Error("Invalid take value in limit clause")
   }
   if (skip < 0 || !Number.isInteger(skip)) {
      throw new Error("Invalid skip value in limit clause")
   }

   const info: any = {
      take: take,
      skip: skip,
      sql: `LIMIT ${take} ${skip ? `OFFSET ${skip}` : ""}`.trim(),
   }

   return info
}

export default BuildLimit;