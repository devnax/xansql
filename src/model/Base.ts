import { EventHandler, EventPayloads } from "../core/classes/EventManager";
import Foreign from "../core/classes/ForeignInfo";
import Xansql from "../core/Xansql";
import XansqlError from "../core/XansqlError";
import { iof } from "../utils";
import XqlIDField from "../xt/fields/IDField";
import { XansqlSchemaObject } from "../xt/types";
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
   hooks: XansqlModelHooks = {};
   xansql: Xansql = null as any;
   alias: string = '';

   constructor(table: string, schema: XansqlSchemaObject) {
      this.table = table;
      this.schema = schema;
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

   async execute(sql: string) {
      const xansql = this.xansql;
      return await xansql.execute(sql) as any
   }

   async drop() {
      const sql = `DROP TABLE ${this.table}`;
      return await this.execute(sql);
   }

   async migrations() {
      let tableSql = ""

      return {
         table: "",
         drop: "",
         indexes: [],
         foreign_keys: [],
      }
   }

   isIDColumn(column: string): boolean {
      return column === this.IDColumn;
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