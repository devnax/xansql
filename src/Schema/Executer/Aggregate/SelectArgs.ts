import Schema from "../..";
import Foreign from "../../../core/classes/ForeignInfo";
import XqlIDField from "../../../Types/fields/IDField";
import XqlNumber from "../../../Types/fields/Number";
import { AggregateSelectArgsColumnType, AggregateSelectArgsType } from "../../type";

class SelectArgs {
   model: Schema

   readonly sql: string;

   constructor(model: Schema, args: AggregateSelectArgsType) {
      this.model = model
      const sqls = []

      for (let column in args) {
         const field = model.schema[column];
         if (!field) {
            throw new Error(`Column ${column} not found in model ${model.table} for aggregate select`)
         }
         if (Foreign.is(field)) {
            throw new Error(`Column ${column} in model ${model.table} is a relation column, cannot be used in aggregate select`)
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
      const isNumber = field instanceof XqlNumber || field instanceof XqlIDField
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