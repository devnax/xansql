import { EventHandler, EventPayloads } from "../core/classes/EventManager";
import Foreign from "../core/classes/ForeignInfo";
import Xansql from "../core/Xansql";
import XansqlError from "../core/XansqlError";
import { iof } from "../utils";
import XqlIDField from "../xt/fields/IDField";
import { XqlSchemaShape } from "../xt/types";
import { XansqlModelHooks } from "./types";

type Relation = {
   type: "array" | "schema",
   column: string,
}

abstract class ModelBase<Xql extends Xansql, T extends string, S extends XqlSchemaShape> {
   readonly schema: S;
   readonly table: T;
   readonly xansql: Xql;
   readonly IDColumn: string = '';
   readonly columns: string[] = [];
   readonly relations: Relation[] = [];
   readonly hooks: XansqlModelHooks = {};

   constructor(xansql: Xql, table: T, schema: S) {
      this.xansql = xansql;
      this.table = table;
      this.schema = schema;
      // this.hooks = schema.hooks;

      for (let column in schema) {
         const field = schema[column];
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
      sql = await this.callHook("beforeExcute", sql) || sql
      const res = await xansql.execute(sql) as any
      return await this.callHook("afterExcute", res) || res
   }

   protected async callHook(hook: keyof XansqlModelHooks, ...args: any): Promise<any> {
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