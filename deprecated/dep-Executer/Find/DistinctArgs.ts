import Model from "../.."
import { ModelType } from "../../../core/types"
import Xansql from "../../../core/Xansql"
import XansqlError from "../../../core/XansqlError"
import { XqlSchemaShape } from "../../../xt/types"
import WhereArgs from "../../Args/WhereArgs"
import { DistinctArgsType, OrderByArgsType } from "../../types"

class DistinctArgs<M extends Model<Xansql, string, XqlSchemaShape>> {
   /**
    * SQL representation of the distinct clause
    * format: WHERE id IN (SELECT MIN(id) FROM table GROUP BY col1) AND id IN (SELECT MAX(id) FROM table GROUP BY col2)
    */
   readonly sql: string = ''

   constructor(model: M, args: DistinctArgsType, where: WhereArgs, orderBy?: OrderByArgsType) {
      const distinct = args || []
      if (distinct && distinct.length) {
         let dcols: string[] = []
         for (let col of distinct) {
            if (!(col in model.schema)) {
               throw new XansqlError({
                  message: `Column ${col} not found in model ${model.table} for distinct`,
                  model: model.table,
                  column: col
               })
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
