import { CreateArgs, DeleteArgs, FindArgs, UpdateArgs } from "./type";
import { isArray } from "../utils";
import ModelBase from "./Base";
import buildFindArgs from "./builder/buildFindArgs";
import BuilFind from "./builder/BuildFInd";

export default class Model extends ModelBase {

   async find(args: FindArgs) {
      const builder = new buildFindArgs(this, args)
      builder.build()
      // const build = new BuilFind(this, args)
      // build.build()
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