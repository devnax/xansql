import Schema from "./schema";
import { ModelsType, XansqlConfig } from "./types";
export * from "./schema";

class xansql {
   private config: XansqlConfig;
   private models: ModelsType = new Map();

   constructor(config: XansqlConfig) {
      this.config = config;
   }

   registerModel<M extends { new(arg: xansql): any }>(Model: M): InstanceType<M> {
      const model = new Model(this);
      let schema = new Schema(model.table, model.schema())
      this.models.set(model.table, {
         model,
         schema,
         schemaSQL: schema.toSQL(this.config.dialect),
         table: model.table
      });
      return model;
   }

   excute(sql: string) {

   }

   migrate(force?: boolean) {

   }
}

export default xansql