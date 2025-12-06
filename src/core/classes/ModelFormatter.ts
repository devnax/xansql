import xt from "../../xt";
import Model from "../../model";
import XqlSchema from "../../xt/fields/Schema";
import Xansql from "../Xansql";
import Foreign from "./ForeignInfo";
import XansqlError from "../XansqlError";

/**
 * this class will format the models and assign relationships
 */

class ModelFormatter {
   private xansql: Xansql
   private isFormated: boolean = false;
   private restricted_columns: string[] = [
      // custom
      // "OPTIONAL", "NULLABLE", "META", "METAARRAY", "SCHEMA", "ARRAY",
      // "EQUALS", "NOT", "LT", "LTE", "GT", "GTE", "IN", "NOTIN", "BETWEEN", "NOTBETWEEN", "CONTAINS", "NOTCONTAINS", "STARTSWITH", "ENDSWITH", "ISNULL", "ISNOTNULL", "ISEMPTY", "ISNOTEMPTY", "ISTRUE", "ISFALSE",
      // "AGGREGATE",
   ];


   constructor(xansql: Xansql) {
      this.xansql = xansql
   }

   private restrictedColumn(column: string): boolean {
      return this.restricted_columns.includes(column.toUpperCase());
   }

   format() {
      if (this.isFormated) return this.xansql.ModelFactory;
      this.isFormated = true;
      const models = this.xansql.ModelFactory;

      // sort models by foreign key dependencies
      const sortedTables: string[] = [];
      for (let table of models.keys()) {
         const model = models.get(table) as Model
         const schema = model.schema
         for (let column in schema) {
            let field: any = schema[column]
            if (Foreign.isSchema(field)) {
               const foreignInfo = Foreign.get(model, column);
               const foreignTable = foreignInfo.table;
               const indexOfMainTable = sortedTables.indexOf(table);
               const indexOfForeignTable = sortedTables.indexOf(foreignTable);

               if (indexOfForeignTable === -1) {
                  // foreign table not in sorted list, add it before main table
                  sortedTables.splice(indexOfMainTable, 0, foreignTable);
               } else if (indexOfForeignTable > indexOfMainTable) {
                  // foreign table is after main table, move it before
                  sortedTables.splice(indexOfForeignTable, 1);
                  sortedTables.splice(indexOfMainTable, 0, foreignTable);
               }
            }
         }
         if (!sortedTables.includes(table)) {
            sortedTables.push(table);
         }
      }

      // update models based with sorted tables
      const sortedModels: Map<string, Model> = new Map();
      for (let table of sortedTables) {
         const model = models.get(table) as Model
         sortedModels.set(table, model);
      }

      // assign relationships
      models.clear();
      for (let [table, model] of sortedModels) {
         models.set(table, model);
      }

      for (let model of models.values()) {
         for (let column in model.schema) {
            if (this.restrictedColumn(column)) {
               throw new XansqlError({
                  message: `Column name "${column}" in model "${model.table}" is restricted and cannot be used.`,
                  model: model.table,
                  column,
               });
            }
            let field: any = model.schema[column]
            if (Foreign.isSchema(field)) {
               this.formatIsSchema(model, column)
            } else if (Foreign.isArray(field)) {
               this.formatIsArray(model, column)
            }
         }
      }

      return models
   }

   private formatIsSchema(model: Model, column: string) {
      const models = this.xansql.ModelFactory;
      let field: any = model.schema[column]
      const FModel = models.get(field.table);
      if (!FModel) {
         throw new XansqlError({
            message: `Foreign model ${field.table} not found for ${model.table}.${column}`,
            model: model.table,
            column
         });
      }

      if (field.column in FModel.schema) {
         const foreignCol = FModel.schema[field.column];
         if (Foreign.isArray(foreignCol)) {
            const foreignType = (foreignCol as any).type as XqlSchema;
            if (foreignType.table !== model.table || foreignType.column !== column) {
               throw new XansqlError({
                  message: `Foreign column ${field.table}.${field.column} does not reference back to ${model.table}.${column}`,
                  model: model.table,
                  column
               });
            }
         } else {
            throw new XansqlError({
               message: `Foreign column ${field.table}.${field.column} is not an array referencing back to ${model.table}.${column}`,
               model: model.table,
               column
            });
         }
      } else {
         const n = xt.schema(model.table, column).nullable()
         n.dynamic = true // to identify that this is a dynamically added field
         FModel.schema[field.column] = xt.array(n)
         models.set(FModel.table, FModel);
      }
   }

   private formatIsArray(model: Model, column: string) {
      const models = this.xansql.ModelFactory;
      let field: any = model.schema[column];
      const FSchemaField = (field as any).type as XqlSchema;
      const FModel = models.get(FSchemaField.table);
      if (!FModel) {
         throw new XansqlError({
            message: `Foreign model ${FSchemaField.table} not found for ${model.table}.${column}`,
            model: model.table,
            column
         });
      }

      if (FSchemaField.column in FModel.schema) {
         const foreignCol = FModel.schema[FSchemaField.column] as XqlSchema;
         if (!Foreign.isSchema(foreignCol) || foreignCol.table !== model.table || foreignCol.column !== column) {
            throw new XansqlError({
               message: `Foreign column ${FSchemaField.table}.${FSchemaField.column} does not reference back to ${model.table}.${column}`,
               model: model.table,
               column
            });
         }
      } else {
         const n = xt.schema(model.table, column)
         if (FSchemaField.meta.nullable) n.nullable()
         if (FSchemaField.meta.optional) n.optional()
         if (FSchemaField.meta.default !== undefined) n.default(FSchemaField.meta.default)
         if (FSchemaField.meta.transform) n.transform(FSchemaField.meta.transform)

         n.dynamic = true // to identify that this is a dynamically added field
         FModel.schema[FSchemaField.column] = n
         models.set(FModel.table, FModel);
      }
   }
}

export default ModelFormatter