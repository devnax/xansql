import Dialect from "./Dialect";
import MysqlDialect from "./dialects/Mysql";
import Model from "./model";
import IDField from "./schema/core/IDField";
import { DialectDrivers, XansqlConfig, XansqlConfigOptions, XansqlDialectDriver, XansqlDialectExcuteReturn, XansqlDialectsFactory, XansqlModelsFactory } from "./type";
import { isServer } from "./utils";
export * from './schema'


class xansql {
   private dialects: XansqlDialectsFactory = new Map()
   private dialect: XansqlDialectDriver | null = null;
   private models: XansqlModelsFactory = new Map()
   private config: XansqlConfig;
   private aliases: { [table: string]: string } = {}

   constructor(config: XansqlConfig) {
      this.config = config;
      const conf = this.getConfig()
      this.dialect = conf.dialect || null
      if (!conf.dialect && typeof conf.connection === 'string') {
         const d = conf.connection.split("://").shift() as any
         if (DialectDrivers.includes(d)) {
            this.dialect = d
         }
      }
      this.initialDialect(MysqlDialect);
   }

   private initialDialect(dialect: typeof Dialect) {
      const instance = new dialect(this);
      if (!instance.driver) {
         throw new Error(`Dialect must have a driver in ${dialect.constructor.name}`);
      }
      this.dialects.set(instance.driver, instance);
   }

   register(model: typeof Model): Model {
      const instance = new model(this);
      if (!instance.table) {
         throw new Error(`Model must have a table name in ${model.constructor.name}`);
      }
      const schema = instance.schema();
      let idcount = 0;
      for (let field in schema) {
         if (schema[field] instanceof IDField) {
            idcount++;
         }
      }

      if (!idcount) {
         throw new Error(`Model ${model.constructor.name} must have an id field`);
      }

      if (idcount > 1) {
         throw new Error(`Model ${model.constructor.name} must have only one id field`);
      }
      const aliasKeys = Object.values(this.aliases)
      let alias = instance.table.split('_').map((word: any) => word[0]).join('');
      let randomNum = Math.floor(Math.random() * 100)
      while (aliasKeys.includes(alias + randomNum)) {
         randomNum = Math.floor(Math.random() * 100)
      }
      this.aliases[instance.table] = alias
      this.models.set(instance.table, instance);
      return instance
   }

   getConfig(): XansqlConfigOptions {
      let config: XansqlConfigOptions = {
         connection: ""
      }
      if (typeof this.config === "function") {
         const conf = this.config();
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

   getModel(table: string) {
      return this.models.get(table)
   }

   getAlias(table: string) {
      const alias = this.aliases[table]
      if (!alias) {
         throw new Error(`Invalid table name to getting alias ${table}`)
      }

      return alias
   }

   getDialect() {
      if (!this.dialect) {
         throw new Error("Invalid Dialect");
      }
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

   async excute(sql: string, model?: Model): Promise<XansqlDialectExcuteReturn<any>> {
      const dialect = this.getDialect();
      if (isServer) {
         return await dialect.excute(sql);
      } else {
         throw new Error("Client excute not implemented yet");
      }
   }

   async migrate() {
      if (isServer) {
         this.models.forEach(async model => {
            const schema = this.buildSchema(model);
            await this.excute(schema)
         })
      }
   }
}

export default xansql