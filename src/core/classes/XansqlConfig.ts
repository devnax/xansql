import { XansqlConfigTypeRequired, XansqlConfigType, XansqlDialectEngine } from "../type";
import Xansql from "../Xansql";

class XansqlConfig {
   readonly xansql: Xansql;
   readonly config: XansqlConfigType;
   readonly engins: XansqlDialectEngine[] = ['mysql', 'postgresql', 'sqlite', 'mssql'];
   constructor(xansql: Xansql, config: XansqlConfigType) {
      this.xansql = xansql;
      this.config = config;

      if (!config.dialect) throw new Error("Dialect is required in Xansql config")
      if (!config.dialect.engine && !config.dialect.execute) throw new Error("Dialect execute function is required in Xansql config")
      if (this.engins.indexOf(config.dialect.engine) === -1) throw new Error(`Dialect engine must be one of ${this.engins.join(', ')}`)
      if (typeof config.dialect.execute !== 'function') throw new Error("Dialect execute must be a function")
   }

   parse() {
      const config = {
         ...this.config,
         maxLimit: {
            find: this.config.maxLimit?.find || 100,
            create: this.config.maxLimit?.create || 100,
            update: this.config.maxLimit?.update || 100,
            delete: this.config.maxLimit?.delete || 100,
         },
         cachePlugins: this.config.cachePlugins || [],
         listenerConfig: this.config.listenerConfig || null,
      }

      return config as XansqlConfigTypeRequired
   }
}

export default XansqlConfig;