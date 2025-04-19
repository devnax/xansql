import { CreateArgs, DeleteArgs, FindArgs, UpdateArgs } from "./type";
import { isArray } from "../utils";
import ModelBase from "./Base";

export default class Model extends ModelBase {

   async find(args: FindArgs) {
      const results = await this.buildFind(args, this)
      return results
   }

   async create(args: CreateArgs) {
      const results = await this.buildCreate(args, this)
      console.log(results);
   }
   async update(args: UpdateArgs) {
      const results = await this.buildUpdate(args, this)
      console.log(results);
   }
   async delete(args: DeleteArgs) {
      const results = await this.buildDelete(args, this)
      console.log(results);
   }
   async sync() {
   }
   async drop() { }
}