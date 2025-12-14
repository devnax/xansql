import { EventHandler, EventPayloads } from "../core/classes/EventManager";
import Foreign from "../core/classes/ForeignInfo";
import Xansql from "../core/Xansql";
import XansqlError from "../core/XansqlError";
import { iof } from "../utils";
import XqlIDField from "../xt/fields/IDField";
import { XansqlSchemaObject } from "../xt/types";
import Migrations from "./Migrations";
import Schema from "./Schema";
import { XansqlModelHookNames, XansqlModelHooks } from "./types";

type Relation = {
   type: "array" | "schema",
   column: string,
}

abstract class ModelBase {
   readonly schema: XansqlSchemaObject;
   readonly table: string;
   readonly IDColumn: string = '';
   readonly columns: string[] = [];
   readonly relations: Relation[] = [];
   readonly hooks: XansqlModelHooks = {};
   readonly xansql: Xansql;

   constructor(xansql: Xansql, schema: Schema) {
      this.xansql = xansql;
      this.table = schema.table;
      this.schema = schema.schema;
      this.hooks = schema.hooks;

      for (let column in schema.schema) {
         const field = schema.schema[column];
         if (iof(field, XqlIDField)) {
            if (this.IDColumn) {
               throw new XansqlError({
                  message: `Model ${this.table} has multiple ID columns (${this.IDColumn} and ${column})`,
                  model: this.table,
               });
            }
            this.IDColumn = column;
         }

         if (Foreign.isArray(field)) {
            this.relations.push({ type: "array", column });
         } else {
            if (Foreign.isSchema(field)) {
               this.relations.push({ type: "schema", column });
            }
            this.columns.push(column);
         }
      }

      if (!this.IDColumn) {
         throw new XansqlError({
            message: `Schema ${this.table} must have an id column`,
            model: this.table,
         });
      }
   }

   get alias(): string {
      return this.xansql.aliases.get(this.table) || "";
   }

   async execute(sql: string) {
      const xansql = this.xansql;
      return await xansql.execute(sql) as any
   }

   protected async callHook(hook: XansqlModelHookNames, ...args: any): Promise<any> {
      const xansql = this.xansql;
      const config = xansql.config;

      const modelHooks: any = this.hooks || {}
      const configHooks: any = config.hooks || {}
      let returnValue = null;

      if (hook in modelHooks!) {
         returnValue = await modelHooks[hook].apply(this, args);
      }

      if (hook in configHooks!) {
         returnValue = await configHooks[hook].apply(null, [this, ...args]);
      }

      return returnValue;
   }

   on<K extends keyof EventPayloads>(event: K, handler: EventHandler<K>) {
      this.xansql.EventManager.on(event, ({ model, ...rest }: any) => {
         handler.apply(this, rest as any);
      });
   }

}

export default ModelBase;