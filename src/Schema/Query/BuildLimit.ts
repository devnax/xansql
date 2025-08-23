import Schema from "..";
import { LimitArgs } from "./types";


const BuildLimit = (args: LimitArgs, schema: Schema) => {

   let take = args.take
   let skip = args.skip
   if (take !== undefined) {
      if (typeof take !== "number" || take < 0 || !Number.isInteger(take)) {
         throw new Error("Invalid take value in limit clause")
      }
   }
   if (skip !== undefined) {
      if (typeof skip !== "number" || skip < 0 || !Number.isInteger(skip)) {
         throw new Error("Invalid skip value in limit clause")
      }
   }

   const info: any = {
      take: take || 50,
      skip: skip || 0,
      joins: {}
   }

   for (let column in args) {
      if (column === "take" || column === "skip") continue
      const relations = schema.xansql.getRelations(schema.table)
      if (!(column in relations)) {
         throw new Error("Invalid column in limit clause: " + column)
      };
      const val = args[column] as LimitArgs
      const relation = relations[column]
      info.joins[column] = BuildLimit(val, relation.foregin.schema)
   }

   return info
}

export default BuildLimit;