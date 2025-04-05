import xansql from "../";
import { Schema } from "../schema/types";
import { CreateArgs, DeleteArgs, FindArgs, UpdateArgs } from "../type";
import ModelBase from "./Base";

class Model extends ModelBase {
   constructor(xansql: xansql) {
      super(xansql)
   }

   schema(): Schema {
      throw new Error(`schema method not implemented in model ${this.constructor.name}`);
   }

   async find(args: FindArgs) {
      const build = this.buildFind(args, this.table)
      console.log(build);

   }
   async create(args: CreateArgs) { }
   async update(args: UpdateArgs) { }
   async delete(args: DeleteArgs) { }
   async sync() {
      const schema = this.xansql.buildSchema(this)
   }
   async drop() { }
}


export default Model