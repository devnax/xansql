import Schema from "..";
import { OrderByArgs } from "./types";

const BuildOrderby = (args: OrderByArgs, schema: Schema) => {
   const info: any = {
      sql: "",
   }

   const items = []

   for (let column in args) {
      const val = args[column]
      const xanv = schema.schema[column]
      const foreign = schema.getForeign(column)
      if (!xanv && !foreign) {
         throw new Error("Invalid column in orderBy clause: " + column)
      };

      if (val === "asc" || val === "desc") {
         items.push(`${schema.table}.${column} ${val.toUpperCase()}`)
      } else {
         throw new Error("Invalid orderBy value for column " + column)
      }
   }
   if (items.length > 0) {
      info.sql += `ORDER BY ${items.join(', ')}`
   }
   return info
}

export default BuildOrderby;