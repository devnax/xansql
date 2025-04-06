import xansql from "../";
import Relation from "../schema/core/Relation";
import { Schema } from "../schema/types";
import { CreateArgs, DeleteArgs, FindArgs, UpdateArgs } from "../type";
import { isObject } from "../utils";
import ModelBase from "./Base";

class Model extends ModelBase {
   constructor(xansql: xansql) {
      super(xansql)
   }

   schema(): Schema {
      throw new Error(`schema method not implemented in model ${this.constructor.name}`);
   }

   async find(args: FindArgs) {
      const { take, skip, orderBy, where, select } = args;
      const schema: Schema = this.schema()
      const alias = this.alias

      let _select = select ? select.map(f => ` ${alias}.${f}`).join(',').trim() : "*"
      let sql = `SELECT ${_select} FROM ${this.table} ${alias}`
      console.log(this.xansql.getModel(this.table));

      for (let field in where) {
         let value = where[field]
         let schemaValue = schema[field]

         if (schemaValue instanceof Relation) {
            const foregen = this.getRelation(this.table, schemaValue)

         } else {
            if (isObject(value)) {

            } else {

            }
         }
      }

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