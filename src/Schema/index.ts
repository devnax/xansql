import { XansqlModelOptions } from "../type";
import { XansqlSchemaObject } from "../Types/types";
import SchemaBase from "./Base";
import AggregateExecuter from "./Executer/Aggregate";
import CreateExecuter from "./Executer/Create";
import DeleteExecuter from "./Executer/Delete";
import FindExecuter from "./Executer/Find";
import UpdateExecuter from "./Executer/Update";
import { AggregateArgsType, CreateArgsType, DeleteArgsType, FindArgsType, UpdateArgsType, WhereArgsType } from "./type";

class Schema extends SchemaBase {

   options: XansqlModelOptions = {}
   constructor(table: string, schema: XansqlSchemaObject) {
      super(table, schema)
   }

   async create(args: CreateArgsType) {
      if (this.options?.hooks && this.options.hooks.beforeCreate) {
         args = await this.options.hooks.beforeCreate(args) || args
      }
      const executer = new CreateExecuter(this);
      const result = await executer.execute(args);
      if (this.options?.hooks && this.options.hooks.afterCreate) {
         return this.options.hooks.afterCreate(result, args) || result
      }
      return result
   }

   async update(args: UpdateArgsType) {
      if (this.options?.hooks && this.options.hooks.beforeUpdate) {
         args = await this.options.hooks.beforeUpdate(args) || args
      }
      const executer = new UpdateExecuter(this);
      const result = await executer.execute(args);
      if (this.options?.hooks && this.options.hooks.afterUpdate) {
         return await this.options.hooks.afterUpdate(result, args) || result
      }
      return result
   }

   async delete(args: DeleteArgsType) {
      if (this.options?.hooks && this.options.hooks.beforeDelete) {
         args = await this.options.hooks.beforeDelete(args) || args
      }
      const executer = new DeleteExecuter(this);
      const result = await executer.execute(args);
      if (this.options.hooks && this.options.hooks.afterDelete) {
         return await this.options.hooks.afterDelete(result, args) || result
      }
      return result
   }

   async find(args: FindArgsType) {
      if (this.options.hooks && this.options.hooks.beforeFind) {
         args = await this.options.hooks.beforeFind(args) || args
      }
      const executer = new FindExecuter(this);
      const result = await executer.execute(args);
      if (this.options.hooks && this.options.hooks.afterFind) {
         return await this.options.hooks.afterFind(result, args) || result
      }
      return result
   }

   async aggregate(args: AggregateArgsType) {
      if (this.options?.hooks && this.options.hooks.beforeAggregate) {
         args = await this.options.hooks.beforeAggregate(args) || args
      }
      const executer = new AggregateExecuter(this);
      const result = await executer.execute(args);
      if (this.options?.hooks && this.options.hooks.afterAggregate) {
         return await this.options.hooks.afterAggregate(result, args) || result
      }
      return result;
   }

   async transection(callback: () => Promise<any>) {
      try {
         await this.execute("BEGIN");
         const result = await callback();
         await this.execute("COMMIT");
         return result;
      } catch (err) {
         await this.execute("ROLLBACK");
         throw err;
      }
   }

   async truncate() {
      await this.execute(`TRUNCATE TABLE ${this.table}`);
      await this.clearCache();
   }


   // Helpers Methods

   async findOne(args: FindArgsType) {
      const res = await this.find({
         ...args,
         limit: {
            take: 1,
            skip: 0
         }
      })
      return res?.[0];
   }

   async findById(id: any, args?: Omit<FindArgsType, "where">) {
      return await this.findOne({
         ...args,
         where: {
            [this.IDColumn]: id
         }
      })
   }

   async count(where: WhereArgsType): Promise<number> {
      const res = await this.aggregate({
         where,
         select: {
            [this.IDColumn]: {
               count: true
            }
         }
      })
      return res.length ? res[0][`count_${this.IDColumn}`] : 0
   }

   async min(column: string, where: WhereArgsType): Promise<number> {
      if (!(column in this.schema)) throw new Error(`Column "${column}" does not exist in table "${this.table}"`);
      const res = await this.aggregate({
         where,
         select: {
            [column]: {
               min: true
            }
         }
      })
      return res.length ? res[0][`min_${column}`] : 0
   }

   async max(column: string, where: WhereArgsType): Promise<number> {
      if (!(column in this.schema)) throw new Error(`Column "${column}" does not exist in table "${this.table}"`);
      const res = await this.aggregate({
         where,
         select: {
            [column]: {
               max: true
            }
         }
      })
      return res.length ? res[0][`max_${column}`] : 0
   }

   async sum(column: string, where: WhereArgsType): Promise<number> {
      if (!(column in this.schema)) throw new Error(`Column "${column}" does not exist in table "${this.table}"`);
      const res = await this.aggregate({
         where,
         select: {
            [column]: {
               sum: true
            }
         }
      })
      return res.length ? res[0][`sum_${column}`] : 0
   }

   async avg(column: string, where: WhereArgsType): Promise<number> {
      if (!(column in this.schema)) throw new Error(`Column "${column}" does not exist in table "${this.table}"`);
      const res = await this.aggregate({
         where,
         select: {
            [column]: {
               avg: true
            }
         }
      })
      return res.length ? res[0][`avg_${column}`] : 0
   }

   async exists(where: WhereArgsType): Promise<boolean> {
      return !!(await this.count({ where }))
   }




   // cache methods
   async clearCache() {
      const cachePlugins = await this.xansql.cachePlugins();
      if (this.xansql && cachePlugins.length) {
         for (let plugin of cachePlugins) {
            if (plugin.clear) {
               await plugin.clear(this)
            }
         }
      }
   }

}

export default Schema;
