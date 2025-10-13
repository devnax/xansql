import { XansqlSchemaObject } from "../Types/types";
import SchemaBase from "./Base";
import CreateExcuter from "./Excuter/CreateExcuter";
import FindExcuter from "./Excuter/FindExcuter";
import UpdateExcuter from "./Excuter/UpdateExcuter";
import AggregateResult from "./Result/AggregateResult";
import CreateResult from "./Result/CreateResult";
import DeleteResult from "./Result/DeleteResult";
import UpdateResult from "./Result/UpdateResult";
import { AggregatePartialArgs, CreateArgsType, DeleteArgs, FindArgsType, UpdateArgsType, XansqlSchemaOptions } from "./type";

class Schema extends SchemaBase {
   private UpdateResult;
   private DeleteResult;

   private FindExcuter;
   private CreateExcuter;
   private UpdateExcuter;
   options: XansqlSchemaOptions

   constructor(table: string, schema: XansqlSchemaObject, options?: XansqlSchemaOptions) {
      super(table, schema)
      this.UpdateResult = new UpdateResult(this)
      this.DeleteResult = new DeleteResult(this)

      this.FindExcuter = new FindExcuter(this)
      this.CreateExcuter = new CreateExcuter(this)
      this.UpdateExcuter = new UpdateExcuter(this)


      this.options = options || {
         log: true,
         hooks: {}
      };
   }

   async create(args: CreateArgsType) {
      return await this.CreateExcuter.excute(args);
   }

   async update(args: UpdateArgsType) {
      return await this.UpdateExcuter.excute(args);
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
