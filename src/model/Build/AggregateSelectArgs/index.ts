import Model from "../..";
import XansqlError from "../../../core/XansqlError";
import { iof } from "../../../utils";
import XqlIDField from "../../../xt/fields/IDField";
import XqlNumber from "../../../xt/fields/Number";
import { AggregateArgsValue, AggregateSelectArgs } from "../../types";

class BuildAggregateSelectArgs {

   readonly sql: string;

   constructor(args: AggregateSelectArgs<any>, private model: Model) {
      const schema = model.schema()
      const sqls = []

      for (let column in args) {
         const field = schema[column] as any
         if (!field) {
            throw new XansqlError({
               code: "VALIDATION_ERROR",
               message: `Column ${column} not found in model ${model.table} for aggregate select`,
               model: model.table,
               field: column
            });
         }
         if (field.isRelation) {
            throw new XansqlError({
               code: "VALIDATION_ERROR",
               message: `Cannot perform aggregate functions on foreign key column ${column} in model ${model.table}`,
               model: model.table,
               field: column
            });
         } else {
            const columnArg = args[column] as AggregateArgsValue
            sqls.push(this.columnFormat(column, columnArg))
         }
      }

      this.sql = sqls.join(", ")
   }

   private columnFormat(column: string, columnArg: AggregateArgsValue) {
      let model = this.model
      const field = model.schema()[column];
      const isNumber = iof(field, XqlNumber, XqlIDField)
      let sql = []
      for (let func in columnArg) {
         const funcArg = columnArg[func as keyof AggregateArgsValue]
         const isObject = funcArg && typeof funcArg === "object"
         // apply distinct
         let col = `${model.alias}.${column}`
         if (isObject && funcArg.distinct === true) {
            col = `DISTINCT ${col}`
         }

         let _sql = `${func.toUpperCase()}(${col})`
         _sql = `CAST(${_sql} AS REAL)`

         if (isObject && funcArg?.round !== undefined) {
            _sql = `ROUND(${_sql}, ${funcArg.round})`
         }

         if (isObject && funcArg.alias) {
            _sql += ` AS ${funcArg.alias}`
         } else {
            _sql += ` AS ${func}_${column}`
         }
         // _sql += ` AS ${func}_${column}`

         sql.push(_sql)
      }
      return sql.join(", ")
   }

}

export default BuildAggregateSelectArgs;