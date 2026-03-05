import Model from "../..";
import XansqlError from "../../../core/XansqlError";
import { OrderByArgs } from "../../types";

class BuildOrderByArgs {
   readonly sql
   constructor(args: OrderByArgs<any>, model: Model<any>) {
      const schema = model.schema()
      const items = []
      for (let column in args) {
         const val = args[column] as "asc" | "desc"
         if (!(column in schema)) {
            throw new XansqlError({
               code: "INVALID_ARGUMENTS",
               message: `Column ${column} not found in model ${model.table} for order by`,
               model: model.table,
               field: column,
               params: args
            })
         };
         if (['asc', 'desc'].includes(val) === false) {
            throw new XansqlError({
               code: "INVALID_ARGUMENTS",
               message: `Invalid order by direction for column ${column} in model ${model.table}. Expected 'asc' or 'desc', got '${val}'`,
               model: model.table,
               field: column,
               params: args
            })
         }
         items.push(`${model.alias}.${column} ${val.toUpperCase()}`)
      }
      this.sql = items.length ? `ORDER BY ${items.join(', ')} ` : ""
   }
}

export default BuildOrderByArgs