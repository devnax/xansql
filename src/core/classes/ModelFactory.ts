import xt from "../../xt";
import Model from "../../model";
import XqlSchema from "../../xt/fields/Schema";
import Foreign from "./ForeignInfo";
import XansqlError from "../XansqlError";

/**
 * this class will format the models and assign relationships
 */
class ModelFactgory {
   private restricted_columns: string[] = [];
   readonly models: Map<string, Model> = new Map();
   readonly aliases: Map<string, string> = new Map();
   private timer: any = null;

   private restrictedColumn(column: string): boolean {
      return this.restricted_columns.includes(column.toUpperCase());
   }

   set(model: Model) {
      this.models.set(model.table, model);
      clearTimeout(this.timer);
      this.timer = setTimeout(() => this.format(), 5);
   }

   get(table: string): Model | undefined {
      return this.models.get(table);
   }

   format() {
      const models = this.models;

      // relationship wiring
      for (const model of models.values()) {
         this.makeAlias(model.table);

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

   private makeAlias(table: string): string {
      if (this.aliases.has(table)) {
         return this.aliases.get(table)!;
      }

      const used = new Set(this.aliases.values());

      const name = table
         .split(/[._]/)
         .pop()!
         .replace(/([a-z])([A-Z])/g, '$1_$2')
         .toLowerCase();

      const parts = name.split('_').filter(Boolean);

      let alias =
         parts.length === 1
            ? parts[0].slice(0, 2)
            : parts.map(p => p[0]).join('');

      if (!alias) alias = 't';

      let unique = alias;
      let i = 1;

      while (used.has(unique)) {
         unique = `${alias}${i++}`;
      }

      this.aliases.set(table, unique);
      return unique;
   }

}

export default ModelFactgory;
