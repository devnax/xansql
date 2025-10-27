import { XansqlConfigOptionsRequired, XansqlConfigType } from "../type";
import Xansql from "../Xansql";

class XansqlConfig {
   xansql: Xansql;
   constructor(xansql: Xansql) {
      this.xansql = xansql;
   }

   parse(config: XansqlConfigType) {
      let format = (typeof config === 'function' ? config() : config)
      if (!format.connection) throw new Error("Connection is required in Xansql config")
      if (!format.dialect) throw new Error("Dialect is required in Xansql config")

      config = {
         ...format,
         maxLimit: {
            find: format.maxLimit?.find || 100,
            create: format.maxLimit?.create || 100,
            update: format.maxLimit?.update || 100,
            delete: format.maxLimit?.delete || 100,
         },
         cachePlugins: format.cachePlugins || [],
         listenerConfig: format.listenerConfig || null,
      }

      return config as XansqlConfigOptionsRequired
   }

}

export default XansqlConfig;