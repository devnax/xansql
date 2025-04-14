import { CreateArgs, DeleteArgs, FindArgs, UpdateArgs } from "./type";
import { isArray } from "../utils";
import ModelBase from "./Base";
import buildFindArgs from "./builder/buildFindArgs";

export default class Model extends ModelBase {

   async find(args: FindArgs) {
      const builder = new buildFindArgs(this, args)
      builder.build()
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