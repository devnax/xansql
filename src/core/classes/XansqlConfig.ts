import { XansqlConfigTypeRequired, XansqlConfigType, XansqlDialectEngine } from "../types";
import Xansql from "../Xansql";
import XansqlError from "../XansqlError";

class XansqlConfig {
   readonly xansql: Xansql;
   readonly config: XansqlConfigType;
   readonly engins: XansqlDialectEngine[] = ['mysql', 'postgres', 'sqlite'];
   constructor(xansql: Xansql, config: XansqlConfigType) {
      this.xansql = xansql;
      this.config = config;

      if (!config.dialect) throw new XansqlError({
         code: "INTERNAL_ERROR",
         message: `Dialect configuration is required in Xansql config.`,
      })
      if (!config.dialect.engine || !config.dialect.execute) throw new XansqlError({
         code: "INTERNAL_ERROR",
         message: `Dialect engine and execute function are required in Xansql config.`,
      })
      if (this.engins.indexOf(config.dialect.engine) === -1) throw new XansqlError({
         code: "INTERNAL_ERROR",
         message: `Dialect engine must be one of ${this.engins.join(', ')}`,
      })
      if (typeof config.dialect.execute !== 'function') throw new XansqlError({
         code: "INTERNAL_ERROR",
         message: `Dialect execute must be a function.`,
      })
   }

   parse() {
      const config = {
         ...this.config,
      }

      return config as XansqlConfigTypeRequired
   }
}

export default XansqlConfig;