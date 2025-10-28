import { Schema, xt } from "../..";
import restrictedColumn from "../../RestrictedColumn";
import Foreign from "../../Schema/include/Foreign";
import XqlSchema from "../../Types/fields/Schema";

/**
 * this class will format the models and assign relationships
 */

type TableName = string

class ModelFormatter {
   private _models: Map<TableName, Schema>
   constructor(models: Map<TableName, Schema>) {
      this._models = new Map()
      models.forEach(model => this._models.set(model.table, model))
   }

   models() {
      const models = new Map(this._models) // create a copy of the models map
      for (let model of models.values()) {
         for (let column in model.schema) {
            if (restrictedColumn(column)) throw new Error(`Column ${column} in model ${model.table} is restricted and cannot be used as a foreign key`);

            let field: any = model.schema[column]
            if (Foreign.isSchema(field)) {
               this.formatIsSchema(model, column)
            } else if (Foreign.isArray(field)) {
               this.formatIsArray(model, column)
            }
         }
      }
      return this._models
   }

   private formatIsSchema(model: Schema, column: string) {
      let field: any = model.schema[column]
      const FModel = this._models.get(field.table);
      if (!FModel) {
         throw new Error(`Foreign model ${field.table} not found for ${model.table}.${column}`);
      }

      if (field.column in FModel.schema) {
         const foreignCol = FModel.schema[field.column];
         if (Foreign.isArray(foreignCol)) {
            const foreignType = (foreignCol as any).type as XqlSchema;
            if (foreignType.table !== model.table || foreignType.column !== column) {
               throw new Error(`Foreign column ${field.table}.${field.column} does not reference back to ${model.table}.${column}`);
            }
         } else {
            throw new Error(`Foreign column ${field.table}.${field.column} is not an array of schemas`);
         }
      } else {
         const n = xt.schema(model.table, column).nullable()
         n.dynamic = true // to identify that this is a dynamically added field
         FModel.schema[field.column] = xt.array(n)
         this._models.set(FModel.table, FModel);
      }
   }

   private formatIsArray(model: Schema, column: string) {
      let field: any = model.schema[column];
      const FSchemaField = (field as any).type as XqlSchema;
      const FModel = this._models.get(FSchemaField.table);
      if (!FModel) {
         throw new Error(`Foreign model ${FSchemaField.table} not found for ${model.table}.${column}`);
      }

      if (FSchemaField.column in FModel.schema) {
         const foreignCol = FModel.schema[FSchemaField.column] as XqlSchema;
         if (!Foreign.isSchema(foreignCol) || foreignCol.table !== model.table || foreignCol.column !== column) {
            throw new Error(`Foreign column ${FSchemaField.table}.${FSchemaField.column} does not reference back to ${model.table}.${column}`);
         }
      } else {

         const n = xt.schema(model.table, column)
         if (FSchemaField.meta.nullable) n.nullable()
         if (FSchemaField.meta.optional) n.optional()
         if (FSchemaField.meta.default !== undefined) n.default(FSchemaField.meta.default)
         if (FSchemaField.meta.transform) n.transform(FSchemaField.meta.transform)

         n.dynamic = true // to identify that this is a dynamically added field
         FModel.schema[FSchemaField.column] = n
         this._models.set(FModel.table, FModel);
      }
   }
}

export default ModelFormatter