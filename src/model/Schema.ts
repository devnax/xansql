import { XansqlSchemaObject } from "../xt/types";
import { XansqlModelHooks } from "./types";

class Schema {
   readonly table: string;
   readonly schema: XansqlSchemaObject;
   readonly hooks: XansqlModelHooks = {};

   constructor(table: string, schema: XansqlSchemaObject) {
      this.table = table;
      this.schema = schema;
   }

   addHook<H extends keyof XansqlModelHooks>(hook: H, fn: XansqlModelHooks[H]) {
      this.hooks[hook] = fn;
   }
}

export default Schema;