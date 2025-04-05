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
      const build = this.buildFind(args, this.schema(), this.table)
      console.log(build);
      const sql = `SELECT ${build.fields.join(', ')} FROM ${this.table} ${build.join.join(' ')}`
      const where = build.where.length ? `WHERE ${build.where.join(' AND ')}` : ''
      const orderBy = build.orderBy.length ? `ORDER BY ${build.orderBy.join(', ')}` : ''


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