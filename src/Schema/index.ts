import { XansqlSchemaObject } from "../Types/types";
import SchemaBase from "./Base";
import AggregateResult from "./Result/AggregateResult";
import CreateResult from "./Result/CreateResult";
import DeleteResult from "./Result/DeleteResult";
import FindResult from "./Result/FindResult";
import UpdateResult from "./Result/UpdateResult";
import { AggregatePartialArgs, CreateArgs, DeleteArgs, FindArgs, UpdateArgs } from "./type";

class Schema extends SchemaBase {

   private CeateResult;
   private FindResult;
   private UpdateResult;
   private DeleteResult;

   constructor(table: string, schema: XansqlSchemaObject) {
      super(table, schema)
      this.CeateResult = new CreateResult(this)
      this.FindResult = new FindResult(this)
      this.UpdateResult = new UpdateResult(this)
      this.DeleteResult = new DeleteResult(this)
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

   async find(args: FindArgs) {
      return await this.FindResult.result(args);
   }

   async aggregate(args: any) {
      const res = new AggregateResult(this)
      return await res.result(args)
   }


   // Helpers Methods

   async findOne(args: FindArgs) {
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

   private async aggregatePartial(args: AggregatePartialArgs, func: string) {
      let column = args.column || this.IDColumn
      const res = await this.aggregate({
         where: args.where,
         groupBy: args.groupBy,
         aggregate: {
            [column]: {
               avg: {
                  round: args.round
               }
            }
         }
      })
      return res.length ? res[0][`${func}_${column}`] : 0
   }

   async count(args: AggregatePartialArgs) {
      return await this.aggregatePartial(args, "count")
   }

   async min(args: AggregatePartialArgs) {
      return await this.aggregatePartial(args, "min")
   }

   async max(args: AggregatePartialArgs) {
      return await this.aggregatePartial(args, "max")
   }

   async sum(args: AggregatePartialArgs) {
      return await this.aggregatePartial(args, "sum")
   }

   async avg(args: AggregatePartialArgs) {
      return await this.aggregatePartial(args, "avg")
   }

}

export default Schema;
