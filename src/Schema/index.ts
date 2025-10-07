import { XansqlSchemaObject } from "../Types/types";
import LimitArgs from "./Args/LimitArgs";
import OrderByArgs from "./Args/OrderByArgs";
import SelectArgs from "./Args/SelectArgs";
import WhereArgs from "./Args/WhereArgs";
import SchemaBase from "./Base";
import FindExcuter from "./Excuter/Find";
import Foreign from "./include/Foreign";
import AggregateResult from "./Result/AggregateResult";
import CreateResult from "./Result/CreateResult";
import DeleteResult from "./Result/DeleteResult";
import FindResult from "./Result/FindResult";
import UpdateResult from "./Result/UpdateResult";
import { AggregatePartialArgs, CreateArgs, DeleteArgs, FindArgsType, UpdateArgs, XansqlSchemaOptions } from "./type";

class Schema extends SchemaBase {
   private CeateResult;
   private FindResult;
   private UpdateResult;
   private DeleteResult;

   private FindExcuter;
   options: XansqlSchemaOptions

   constructor(table: string, schema: XansqlSchemaObject, options?: XansqlSchemaOptions) {
      super(table, schema)
      this.CeateResult = new CreateResult(this)
      this.FindResult = new FindResult(this)
      this.UpdateResult = new UpdateResult(this)
      this.DeleteResult = new DeleteResult(this)
      this.FindExcuter = new FindExcuter(this)
      this.options = options || {
         log: true,
         hooks: {}
      };
   }

   async create(args: CreateArgs) {
      return await this.CeateResult.result(args);
   }

   async update(args: UpdateArgs) {
      return await this.UpdateResult.result(args);
   }

   async delete(args: DeleteArgs) {
      return await this.DeleteResult.result(args);
   }

   async find(args: FindArgsType) {
      const result = await this.FindExcuter.excute(args);
      return result
      // return await this.FindResult.result(args);
   }

   async aggregate(args: any) {
      const res = new AggregateResult(this)
      return await res.result(args)
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
         aggregate: {
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
