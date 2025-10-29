import { Schema, Xansql, xt } from "../..";
import Foreign from "../../Schema/include/Foreign";
import XqlSchema from "../../Types/fields/Schema";

/**
 * this class will format the models and assign relationships
 */

type TableName = string

class ModelFormatter {
   private xansql: Xansql
   private isFormated: boolean = false;
   private restricted_columns = [
      "ADD", "ALL", "ALTER", "AND", "ANY", "AS", "ASC", "BETWEEN", "BY",
      "CASE", "CAST", "CHECK", "COLUMN", "CONSTRAINT", "CREATE", "CROSS",
      "CURRENT", "CURRENT_DATE", "CURRENT_TIME", "CURRENT_TIMESTAMP",
      "DEFAULT", "DELETE", "DESC", "DISTINCT", "DROP", "ELSE", "EXISTS",
      "FALSE", "FETCH", "FOR", "FOREIGN", "FROM", "FULL", "GRANT", "GROUP",
      "HAVING", "INNER", "INSERT", "INTERSECT", "INTO", "IS", "JOIN",
      "KEY", "LEFT", "LIKE", "LIMIT", "NOT", "NULL", "ON", "OR", "ORDER",
      "OUTER", "PRIMARY", "REFERENCES", "RIGHT", "ROLLBACK", "SELECT", "SET",
      "TABLE", "THEN", "TO", "TRUE", "UNION", "UNIQUE", "UPDATE",
      "USING", "VALUES", "VIEW", "WHEN", "WHERE", "WITH", "SECTION",

      // custom
      "INDEX", "OPTIONAL", "NULLABLE", "META", "METAARRAY", "SCHEMA", "ARRAY",
      "EQUALS", "NOT", "LT", "LTE", "GT", "GTE", "IN", "NOTIN", "BETWEEN", "NOTBETWEEN", "CONTAINS", "NOTCONTAINS", "STARTSWITH", "ENDSWITH", "ISNULL", "ISNOTNULL", "ISEMPTY", "ISNOTEMPTY", "ISTRUE", "ISFALSE",
      "AGGREGATE",
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
      for (let model of models.values()) {
         for (let column in model.schema) {
            if (this.restrictedColumn(column)) throw new Error(`Column ${column} in model ${model.table} is restricted and cannot be used as a foreign key`);
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

   private formatIsSchema(model: Schema, column: string) {
      const models = this.xansql.ModelFactory;
      let field: any = model.schema[column]
      const FModel = models.get(field.table);
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
         models.set(FModel.table, FModel);
      }
   }

   private formatIsArray(model: Schema, column: string) {
      const models = this.xansql.ModelFactory;
      let field: any = model.schema[column];
      const FSchemaField = (field as any).type as XqlSchema;
      const FModel = models.get(FSchemaField.table);
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
         models.set(FModel.table, FModel);
      }
   }
}

export default ModelFormatter