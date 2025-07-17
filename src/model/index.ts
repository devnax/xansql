import { CountArgs, CreateArgs, DeleteArgs, FindArgs, ReturnCount, UpdateArgs } from "./type";
import ModelBase from "./Base";

export default class Model<DATA extends {} = {}> extends ModelBase {

   async find(args: FindArgs): Promise<DATA[] | null> {
      const results = await this.buildFind(args, this)
      console.log("Model.find results:", results);

      return results
   }
   async create(args: CreateArgs): Promise<DATA[]> {
      const results = await this.buildCreate(args, this)
      return results
   }

   async update(args: UpdateArgs): Promise<DATA[] | null> {
      const results = await this.buildUpdate(args, this)
      return results
   }
   async delete(args: DeleteArgs) {
      const affectedRows = await this.buildDelete(args, this)
      return {
         success: affectedRows > 0,
         deletedRows: affectedRows,
      }
   }
   async count(args: CountArgs): Promise<ReturnCount> {
      const results = await this.buildCount(args, this)
      return results
   }

   async findOne(args: FindArgs): Promise<DATA | null> {
      const results = await this.find({
         ...args,
         limit: {
            ...args.limit,
            take: 1,
         }
      })
      return results?.length ? results[0] : null
   }

   async upsert(args: UpdateArgs) {
      const results = await this.update(args)
      if (!results?.length) {
         const createArgs: CreateArgs = {
            data: args.data as any,
            select: args.select
         }
         const createResults = await this.create(createArgs)
         return createResults
      }
      return results
   }

}