import Schema from ".."
import { OrderByArgsType } from "../type"

class OrderByArgs {
   /**
    * SQL representation of the order by clause
    * format: ORDER BY col1 ASC, col2 DESC
    */
   readonly sql: string = ''

   constructor(model: Schema, args: OrderByArgsType) {
      const items = []
      for (let column in args) {
         const val = args[column]
         if (!(column in model.schema)) {
            throw new Error(`Invalid column in orderBy clause: ${column} in model ${model.table}`)
         };
         if (['asc', 'desc'].includes(val) === false) {
            throw new Error(`Invalid orderBy value for column ${column} in model ${model.table}`)
         }
         items.push(`${model.table}.${column} ${val.toUpperCase()}`)
      }
      this.sql = items.length ? `ORDER BY ${items.join(', ')} ` : ""
   }
}

export default OrderByArgs;