import { XansqlModelOptions } from "../type";
import { XansqlSchemaObject } from "../Types/types";
import SchemaBase from "./Base";
import AggregateExecuter from "./Executer/Aggregate";
import CreateExecuter from "./Executer/Create";
import DeleteExecuter from "./Executer/Delete";
import FindExecuter from "./Executer/Find";
import UpdateExecuter from "./Executer/Update";
import { AggregateArgsType, AggregatePartialArgs, CreateArgsType, DeleteArgsType, FindArgsType, UpdateArgsType } from "./type";

class Schema extends SchemaBase {

   options: XansqlModelOptions = {}
   constructor(table: string, schema: XansqlSchemaObject) {
      super(table, schema)
   }

   async create(args: CreateArgsType) {
      const executer = new CreateExecuter(this);
      return await executer.execute(args);
   }

   async update(args: UpdateArgsType) {
      const executer = new UpdateExecuter(this);
      return await executer.execute(args);
   }

   async delete(args: DeleteArgsType) {
      const executer = new DeleteExecuter(this);
      return await executer.execute(args);
   }

   async find(args: FindArgsType) {
      const executer = new FindExecuter(this);
      return await executer.execute(args);
   }

   async aggregate(args: AggregateArgsType) {
      const executer = new AggregateExecuter(this);
      return await executer.execute(args);
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


   // Aggregate Helpers
   private async _aggregate(args: AggregatePartialArgs, func: string) {
      let column = args.column || this.IDColumn
      const res = await this.aggregate({
         where: args.where,
         groupBy: args.groupBy,
         select: {
            [column]: {
               [func]: {
                  round: args.round
               }
            }
         }
      })
      return res.length ? res[0][func] : 0
   }

   async count(args: AggregatePartialArgs) {
      return await this._aggregate(args, "count")
   }

   async min(args: AggregatePartialArgs) {
      return await this._aggregate(args, "min")
   }

   async max(args: AggregatePartialArgs) {
      return await this._aggregate(args, "max")
   }

   async sum(args: AggregatePartialArgs) {
      return await this._aggregate(args, "sum")
   }

   async avg(args: AggregatePartialArgs) {
      return await this._aggregate(args, "avg")
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
