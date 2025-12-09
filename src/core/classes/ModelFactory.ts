import xt from "../../xt";
import Model from "../../model";
import XqlSchema from "../../xt/fields/Schema";
import Xansql from "../Xansql";
import Foreign from "./ForeignInfo";
import XansqlError from "../XansqlError";

/**
 * this class will format the models and assign relationships
 */
class ModelFactgory {
   private xansql: Xansql;
   private isFormated: boolean = false;
   private restricted_columns: string[] = [];
   readonly models: Map<string, Model> = new Map();

   constructor(xansql: Xansql) {
      this.xansql = xansql;
   }

   private restrictedColumn(column: string): boolean {
      return this.restricted_columns.includes(column.toUpperCase());
   }

   /**
    * Topological sort with cycle detection
    */
   private sortModelsByDependencies(models: Map<string, Model>): string[] {
      const graph = new Map<string, Set<string>>();
      const visiting = new Set<string>();
      const visited = new Set<string>();
      const result: string[] = [];

      // build dependency graph
      for (const [table, model] of models) {
         const deps = new Set<string>();
         for (const column in model.schema) {
            const field: any = model.schema[column];
            if (Foreign.isSchema(field)) {
               deps.add(field.table);
            }
         }
         graph.set(table, deps);
      }

      const visit = (table: string) => {
         if (visiting.has(table)) {
            throw new XansqlError({
               message: `Circular foreign key detected involving "${table}"`,
               model: table
            });
         }

         if (visited.has(table)) return;

         visiting.add(table);

         const deps = graph.get(table);
         if (deps) {
            for (const dep of deps) {
               if (!models.has(dep)) {
                  throw new XansqlError({
                     message: `Foreign model "${dep}" not found while sorting "${table}"`,
                     model: table
                  });
               }
               visit(dep);
            }
         }

         visiting.delete(table);
         visited.add(table);
         result.push(table);
      };

      for (const table of models.keys()) {
         visit(table);
      }

      return result;
   }

   format() {
      if (this.isFormated) {
         return this.models;
      }
      const models = this.models;

      // Proper, safe table sorting
      const sortedTables = this.sortModelsByDependencies(models);

      // rebuild model map in correct order
      const sortedModels = new Map<string, Model>();
      for (const table of sortedTables) {
         const model = models.get(table) as Model;
         sortedModels.set(table, model);
      }

      models.clear();
      for (const [table, model] of sortedModels) {
         models.set(table, model);
      }

      // relationship wiring
      for (const model of models.values()) {
         for (const column in model.schema) {
            if (this.restrictedColumn(column)) {
               throw new XansqlError({
                  message: `Column name "${column}" in model "${model.table}" is restricted and cannot be used.`,
                  model: model.table,
                  column,
               });
            }

            const field: any = model.schema[column];

            if (Foreign.isSchema(field)) {
               this.formatIsSchema(model, column);
            } else if (Foreign.isArray(field)) {
               this.formatIsArray(model, column);
            }
         }
      }

      this.isFormated = true;
      return models;
   }

   private formatIsSchema(model: Model, column: string) {
      const models = this.models;
      const field: any = model.schema[column];

      const FModel = models.get(field.table);
      if (!FModel) {
         throw new XansqlError({
            message: `Foreign model "${field.table}" not found for ${model.table}.${column}`,
            model: model.table,
            column
         });
      }

      // ensure reciprocal field exists
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
         const n = xt.schema(model.table, column).nullable();
         (n as any).dynamic = true;
         FModel.schema[field.column] = xt.array(n);
         models.set(FModel.table, FModel);
      }
   }

   private formatIsArray(model: Model, column: string) {
      const models = this.models;
      const field: any = model.schema[column];
      const FSchemaField = (field as any).type as XqlSchema;

      const FModel = models.get(FSchemaField.table);
      if (!FModel) {
         throw new XansqlError({
            message: `Foreign model "${FSchemaField.table}" not found for ${model.table}.${column}`,
            model: model.table,
            column
         });
      }

      if (FSchemaField.column in FModel.schema) {
         const foreignCol = FModel.schema[FSchemaField.column] as any;

         if (
            !Foreign.isSchema(foreignCol) ||
            foreignCol.table !== model.table ||
            foreignCol.column !== column
         ) {
            throw new XansqlError({
               message: `Foreign column ${FSchemaField.table}.${FSchemaField.column} does not reference back to ${model.table}.${column}`,
               model: model.table,
               column
            });
         }
      } else {
         const n = xt.schema(model.table, column);

         if (FSchemaField.meta?.nullable) n.nullable();
         if (FSchemaField.meta?.optional) n.optional();
         if (FSchemaField.meta?.default !== undefined) n.default(FSchemaField.meta.default);
         if (FSchemaField.meta?.transform) n.transform(FSchemaField.meta.transform);

         (n as any).dynamic = true;
         FModel.schema[FSchemaField.column] = n;
         models.set(FModel.table, FModel);
      }
   }
}

export default ModelFactgory;
