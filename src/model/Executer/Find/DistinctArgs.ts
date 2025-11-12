import Model from "../.."
import WhereArgs from "../../Args/WhereArgs"
import { DistinctArgsType, OrderByArgsType } from "../../type"

class DistinctArgs {
   /**
    * SQL representation of the distinct clause
    * format: WHERE id IN (SELECT MIN(id) FROM table GROUP BY col1) AND id IN (SELECT MAX(id) FROM table GROUP BY col2)
    */
   readonly sql: string = ''

   constructor(model: Model, args: DistinctArgsType, where: WhereArgs, orderBy?: OrderByArgsType) {
      const distinct = args || []
      if (distinct && distinct.length) {
         let dcols: string[] = []
         for (let col of distinct) {
            if (!(col in model.schema)) {
               throw new Error("Invalid column in distinct clause: " + col)
            };
            let MX = orderBy && orderBy[col] === "desc" ? "MAX" : "min"
            dcols.push(`${model.table}.${model.IDColumn} IN (
               SELECT ${MX}(${model.table}.${model.IDColumn})
               FROM ${model.table}
               ${where.sql}
               GROUP BY  ${col}
            )`)
         }
         if (dcols.length) {
            this.sql = `${dcols.join(" AND ")}`.trim()
         }
      }

   }
}
export default DistinctArgs;
