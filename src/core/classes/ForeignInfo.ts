import Model from "../../model";
import { iof } from "../../utils";
import XqlArray from "../../xt/fields/Array";
import XqlSchema from "../../xt/fields/Schema";
import { XqlFields } from "../../xt/types";
import XansqlError from "../XansqlError";


export type ForeignInfoType = {
   table: string
   column: string
   relation: {
      main: string
      target: string
   }
   sql: string
}
/**
 * Foreign Key Class
 * @description This class is used to handle foreign key relationships between models
 * @example
 * const foreignInfo = Foreign.info(model, column);
 * console.log(foreignInfo);
 */
class Foreign {

   static is(field: XqlFields) {
      return this.isArray(field) || this.isSchema(field)
   }

   static isArray(field: XqlFields) {
      return iof(field, XqlArray) && this.isSchema((field as any).type)
   }

   static isSchema(field: XqlFields) {
      return iof(field, XqlSchema)
   }

   static get(model: Model, column: string): ForeignInfoType {
      let table = model.table
      let schema = model.schema
      let field: any = schema[column]

      if (this.isArray(field)) {
         const foreignType = field.type as XqlSchema;
         return {
            table: foreignType.table,
            column: foreignType.column,
            relation: {
               main: foreignType.column,
               target: model.IDColumn,
            },
            sql: `${foreignType.table}.${foreignType.column} = ${model.table}.${model.IDColumn}`
         }
      } else if (this.isSchema(field)) {
         const FModel = model.xansql.getModel(field.table)
         return {
            table: field.table,
            column: field.column,
            relation: {
               main: FModel.IDColumn,
               target: column
            },
            sql: `${field.table}.${FModel.IDColumn} = ${model.table}.${column}`
         }
      }
      throw new XansqlError({
         message: `Field ${column} in model ${model.table} is not a foreign key.`,
         model: model.table,
      });
   }

}

export default Foreign