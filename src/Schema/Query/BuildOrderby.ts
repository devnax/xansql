import Schema from "..";
import { OrderByArgs } from "./types";

const BuildOrderby = (args: OrderByArgs, schema: Schema) => {
   const info: any = {
      sql: "",
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
         info.joins[column] = BuildOrderby(val, relation.foregin.schema)
      }
   }
   if (items.length > 0) {
      info.sql += `ORDER BY ${items.join(', ')}`
   }
   return info
}

export default BuildOrderby;