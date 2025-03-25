import Dialect from "./Dialect";
import MysqlDialect from "./dialects/Mysql";
import IDField from "./schema/core/IDField";
import Model from "./Model";
import { XansqlConfig, XansqlConfigOptions, XansqlDialectExcuteReturn, XansqlDialectsFactory, XansqlModelsFactory } from "./type";
import { isServer } from "./utils";
export * from './schema'

class xansql {
   private dialects: XansqlDialectsFactory = new Map()
   private models: XansqlModelsFactory = new Map()
   config: XansqlConfig;
   dialect: string = "mysql";

   constructor(config: XansqlConfig) {
      this.config = config;
      this.registerDialect(MysqlDialect);
   }

   registerDialect(dialect: typeof Dialect) {
      const instance = new dialect(this);
      if (!instance.name) {
         throw new Error(`Dialect must have a name in ${dialect.constructor.name}`);
      }
      this.dialects.set(instance.name, instance);
   }

   registerModel(model: typeof Model): Model {
      const instance = new model(this);
      if (!instance.table) {
         throw new Error(`Model must have a table name in ${model.constructor.name}`);
      }
      const schema = instance.schema();
      let hasId = false;
      for (let field in schema) {
         if (schema[field] instanceof IDField) {
            hasId = true;
            break;
         }
      }

      if (!hasId) {
         throw new Error(`Model ${model.constructor.name} must have an id field`);
      }

      this.models.set(instance.table, instance);
      return instance
   }

   async getConfig(): Promise<XansqlConfigOptions> {
      let config: XansqlConfigOptions = {
         connection: ""
      }
      if (typeof this.config === "function") {
         const conf = await this.config();
         if (typeof conf === "string") {
            config.connection = conf;
         } else {
            config = conf;
         }
      } else if (typeof this.config === "string") {
         config.connection = this.config;
      } else {
         config = this.config;
      }

      return config;
   }

   getDialect() {
      const dialect = this.dialects.get(this.dialect);
      if (!dialect) {
         throw new Error(`Dialect ${this.dialect} not registered`);
      }
      return dialect;
   }

   buildSchema(model: Model) {
      const dialect = this.getDialect();
      return dialect.buildSchema(model);
   }

   async excute(sql: string): Promise<XansqlDialectExcuteReturn<any>> {
      const dialect = this.getDialect();
      if (isServer) {
         const res = await dialect.excute(sql);
         return res
      } else {
         throw new Error("Client excute not implemented yet");
      }
   }
}

export default xansql