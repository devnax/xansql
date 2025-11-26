import { EventHandler, EventNames } from "../core/classes/EventManager";
import Foreign from "../core/classes/ForeignInfo";
import { XansqlModelOptions } from "../core/type";
import Xansql from "../core/Xansql";
import XansqlError from "../core/XansqlError";
import XqlIDField from "../Types/fields/IDField";
import { XansqlSchemaObject } from "../Types/types";

type Hooks =
   | 'beforeFind'
   | 'afterFind'
   | 'beforeCreate'
   | 'afterCreate'
   | 'beforeUpdate'
   | 'afterUpdate'
   | 'beforeDelete'
   | 'afterDelete'
   | 'beforeAggregate'
   | 'afterAggregate'
   | 'beforeExecute'
   | 'afterExecute'
   | 'beforeMigrate'
   | 'afterMigrate'
   | 'transform';

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
   options: Required<XansqlModelOptions> = {
      hooks: {}
   }
   xansql: Xansql = null as any;
   alias: string = '';

   constructor(table: string, schema: XansqlSchemaObject) {
      this.table = table;
      this.schema = schema;
      for (let column in schema) {
         const field = schema[column];
         if (field instanceof XqlIDField) {
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

   isIDColumn(column: string): boolean {
      return column === this.IDColumn;
   }

   protected async callHook(hook: Hooks, ...args: any): Promise<any> {
      const xansql = this.xansql;
      const config = xansql.config;

      const modelHooks: any = this.options.hooks || {}
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

   on<K extends EventNames>(event: K, handler: EventHandler<K>) {
      this.xansql.EventManager.on(event, ({ model, ...rest }: any) => {
         handler.apply(this, rest as any);
      });
   }

}

export default ModelBase;