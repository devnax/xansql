import xansql from "..";
import Schema, { id } from "../schema";
import Relation from "../schema/core/Relation";
import { SchemaMap } from "../schema/types";
import { FindArgs } from "./type";


abstract class ModelBase {
   xansql: xansql;
   table: string = "";
   alias: string = "";
   schema: Schema = new Schema({ id: id() });

   constructor(xansql: xansql) {
      this.xansql = xansql
   }

   getRelation(column: string) {
      const schema = this.schema.get()
      const foregin = schema[column]
      console.log(foregin);

      if (!(foregin instanceof Relation)) throw new Error(`Invalid relation column ${this.table}.${column}`)

      let single = false

      if (!foregin.table) {
         const reference: any = schema[foregin.column]
         foregin.table = reference.constraints.references.table
         foregin.column = reference.constraints.references.column
         single = true
      } else {
         //   let mainSchema = this.xansql.getModel(foregin.table).schema.get()
      }

      if (!foregin.table) throw new Error(`Invalid relation table name ${this.table}`)
      if (!foregin.column) throw new Error(`Invalid relation column name ${this.table}`)

      return {
         single,
         main: {
            table: this.table,
            column,
            alias: this.alias,
         },
         foregin: {
            table: foregin.table,
            column: foregin.column,
            alias: this.xansql.getModel(foregin.table).alias,
         }
      }
   }


}

export default ModelBase