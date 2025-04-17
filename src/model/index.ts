import { CreateArgs, DeleteArgs, FindArgs, UpdateArgs } from "./type";
import { isArray } from "../utils";
import ModelBase from "./Base";

export default class Model extends ModelBase {

   async find(args: FindArgs) {
      const results = await this.buildFind(args, this)
      return results
   }

   async create(args: CreateArgs) {
      if (!isArray(args)) {

      } else {

      }
   }
   async update(args: UpdateArgs) { }
   async delete(args: DeleteArgs) { }
   async sync() {
   }
   async drop() { }
}