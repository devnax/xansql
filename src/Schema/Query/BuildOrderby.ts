import Schema from "..";
import { OrderByArgs } from "./types";

const BuildOrderby = (args: OrderByArgs, schema: Schema) => {
   const info: any = {
      sql: "ORDER BY ",
      joins: {}
   }

   const items = []

   for (let column in args) {
      const val = args[column]
      const xanv = schema.schema[column]
      const relations = schema.xansql.getRelations(schema.table)
      if (!xanv && !(column in relations)) {
         throw new Error("Invalid column in orderBy clause: " + column)
      };

      if (val === "asc" || val === "desc") {
         items.push(`${schema.alias}.${column} ${val.toUpperCase()}`)
      } else {
         const relation = relations[column]
         const foreginModel = schema.xansql.getSchema(relation.foregin.table)
         if (!foreginModel) {
            throw new Error("Foregin model not found for relation " + column)
         }
         info.joins[column] = BuildOrderby(val, foreginModel)
      }
   }

   info.sql += items.join(", ")
   return info
}

export default BuildOrderby;