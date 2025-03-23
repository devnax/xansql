import Schema from "./schema";
import { Dialects } from "./schema/types";
import { ModelsType, XansqlConfig } from "./types";
import { isBrowser } from "./utils";
export * from "./schema";

class xansql {
   private config: XansqlConfig = {};
   dialect: Dialects = "mysql";
   models: ModelsType = new Map();
   databaseUrl: string = "";
   private excuter: any;

   constructor(databaseUrl?: string, config?: XansqlConfig) {
      this.databaseUrl = databaseUrl || ''
      if (!isBrowser) {
         if (!databaseUrl) throw new Error("Database URL is required");
         if (databaseUrl.startsWith("mysql")) {
            this.dialect = "mysql";
         } else if (databaseUrl.startsWith("sqlite")) {
            this.dialect = "sqlite";
         } else if (databaseUrl.startsWith("postgres")) {
            this.dialect = "postgres";
         } else if (databaseUrl.startsWith("mssql")) {
            this.dialect = "mssql";
         } else {
            throw new Error("Unsupported database URL");
         }
         this.loadExcuter()
      }

      this.config = config || {};
      if (this.config.dialect) {
         this.dialect = this.config.dialect;
      }
   }

   private async loadExcuter() {
      if (this.excuter) return this.excuter;
      if (isBrowser) {
         const excuter = await import("./excute/client");
         this.excuter = new excuter.default;
      } else {
         const excuter = await import("./excute/server");
         this.excuter = new excuter.default(this);
      }
   }

   registerModel<M extends { new(arg: xansql): any }>(Model: M): InstanceType<M> {
      const model = new Model(this);
      let schema = new Schema(model.table, model.schema())
      const schemaSQL = schema.toSQL(this.dialect);
      model.schemaSQL = schemaSQL

      this.models.set(model.table, {
         model,
         schema,
         schemaSQL,
         table: model.table
      });
      return model;
   }

   async excute(sql: string) {
      await this.loadExcuter();
      const result = await this.excuter.excute(sql);
      return result
   }

   migrate(force?: boolean) {

   }
}

export default xansql