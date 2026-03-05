import { ModelType } from "../../../core/types"
import XansqlError from "../../../core/XansqlError"
import { OrderByArgsType } from "../../types"

class OrderByArgs {
   /**
    * SQL representation of the order by clause
    * format: ORDER BY col1 ASC, col2 DESC
    */
   readonly sql: string = ''

   constructor(model: ModelType, args: OrderByArgsType) {
      const items = []
      for (let column in args) {
         const val = args[column]
         if (!(column in model.schema)) {
            throw new XansqlError({
               message: `Column ${column} not found in model ${model.table} for order by`,
               model: model.table,
               column: column
            })
         };
         if (['asc', 'desc'].includes(val) === false) {
            throw new XansqlError({
               message: `Invalid order by direction for column ${column} in model ${model.table}. Expected 'asc' or 'desc', got '${val}'`,
               model: model.table,
               column: column
            })
         }
         items.push(`${model.table}.${column} ${val.toUpperCase()}`)
      }
      this.sql = items.length ? `ORDER BY ${items.join(', ')} ` : ""
   }
}

export default OrderByArgs;