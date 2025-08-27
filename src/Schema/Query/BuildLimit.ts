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
      sql: "",
      joins: {}
   }

   if (info.take) {
      info.sql += ` LIMIT ${info.take}`
      if (info.skip) {
         info.sql += ` OFFSET ${info.skip}`
      }
   }

   for (let column in args) {
      if (column === "take" || column === "skip") continue
      const relation = schema.xansql.getRelation(schema.table, column)
      if (!relation) {
         throw new Error("Invalid column in limit clause: " + column)
      };
      const val = args[column] as LimitArgs
      const foreginModel = schema.xansql.getSchema(relation.foregin.table)
      info.joins[column] = BuildLimit(val, foreginModel)
   }

   return info
}

export default BuildLimit;