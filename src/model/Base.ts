import xansql from "..";
import Schema, { id } from "../schema";
import Column from "../schema/core/Column";
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
      const relation_column = schema[column]
      if (!(relation_column instanceof Relation)) throw new Error(`Invalid relation column ${this.table}.${column}`)

      let single = false

      if (!relation_column.table) {
         const reference: any = schema[relation_column.column]
         relation_column.table = reference.constraints.references.table
         relation_column.column = reference.constraints.references.column
         single = true
      }

      const foreginModel = this.xansql.getModel((relation_column as any).table)
      if (!foreginModel) throw new Error(`Invalid table name ${relation_column.table}`)
      const foreginSchema = foreginModel.schema.get()
      const foreginColumn = foreginSchema[relation_column.column]

      if (!(foreginColumn instanceof Column)) throw new Error(`Invalid relation column ${relation_column.table}.${relation_column.column}`)
      const references = foreginColumn.constraints.references
      if (!references) throw new Error(`Invalid relation column ${relation_column.table}.${relation_column.column}`)
      if (references.table !== this.table) throw new Error(`Invalid relation column ${relation_column.table}.${relation_column.column}`);

      return {
         single: false,
         main: {
            table: references.table,
            column: references.column,
            alias: this.alias,
         },
         foregin: {
            table: relation_column.table as string,
            column: relation_column.column,
            alias: foreginModel.alias
         }
      }
   }


}

export default ModelBase