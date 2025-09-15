import SchemaBase from "./Base";
import CreateResult from "./Result/CreateResult";
import DeleteResult from "./Result/DeleteResult";
import FindResult from "./Result/FindResult";
import UpdateResult from "./Result/UpdateResult";
import { CountArgs, CreateArgs, DeleteArgs, FindArgs, UpdateArgs } from "./type";

class Schema extends SchemaBase {

   private CeateResult = new CreateResult(this)
   private FindResult = new FindResult(this)
   private UpdateResult = new UpdateResult(this)
   private DeleteResult = new DeleteResult(this)

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

   async count(args: CountArgs) {
      const res = await this.find(args)
      return res?.length || 0;
   }

   async aggregate(args: any) {
      throw new Error("Not implemented");
   }

}

export default Schema;
