import Model from "../..";
import Foreign from "../../../core/classes/ForeignInfo";
import XansqlError from "../../../core/XansqlError";
import { iof } from "../../../utils";
import XqlIDField from "../../../xt/fields/IDField";
import XqlNumber from "../../../xt/fields/Number";
import { AggregateSelectArgsColumnType, AggregateSelectArgsType } from "../../types";

class SelectArgs {
   model: Model

   readonly sql: string;

   constructor(model: Model, args: AggregateSelectArgsType) {
      this.model = model
      const sqls = []

      for (let column in args) {
         const field = model.schema[column];
         if (!field) {
            throw new XansqlError({
               message: `Column ${column} not found in model ${model.table} for aggregate select`,
               model: model.table,
               column: column
            });
         }
         if (Foreign.is(field)) {
            throw new XansqlError({
               message: `Cannot perform aggregate functions on foreign key column ${column} in model ${model.table}`,
               model: model.table,
               column: column
            });
         } else {
            const columnArg = args[column] as AggregateSelectArgsColumnType
            sqls.push(this.columnFormat(column, columnArg))
         }
      }

      this.sql = sqls.join(", ")
   }

   columnFormat(column: string, columnArg: AggregateSelectArgsColumnType) {
      let model = this.model
      const field = model.schema[column];
      const isNumber = iof(field, XqlNumber, XqlIDField)
      let sql = []
      for (let func in columnArg) {
         const funcArg = columnArg[func as keyof AggregateSelectArgsColumnType]
         const isObject = funcArg && typeof funcArg === "object"
         // apply distinct
         let col = column
         if (isObject && funcArg.distinct === true) {
            col = `DISTINCT ${col}`
         }

         let _sql = `${func.toUpperCase()}(${col})`

         // make to integer for all as REAL
         if (!isNumber) {
            _sql = `CAST(${_sql} AS REAL)`
         }

         if (isObject && funcArg?.round !== undefined) {
            _sql = `ROUND(${_sql}, ${funcArg.round})`
         }

         if (isObject && funcArg.alias) {
            _sql += ` AS ${funcArg.alias}`
         } else {
            _sql += ` AS ${func}_${column}`
         }

         sql.push(_sql)
      }
      return sql.join(", ")
   }

}

export default SelectArgs;