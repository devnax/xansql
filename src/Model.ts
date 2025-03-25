import xansql from ".";
import { Schema } from "./schema/types";

class Model {
   xansql: xansql
   table!: string
   constructor(xansql: xansql) {
      this.xansql = xansql;
   }

   schema(): Schema {
      throw new Error(`schema method not implemented in model ${this.constructor.name}`);
   }

   async find(args: any) {
      const res = await this.xansql.excute('SELECT * FROM ' + this.table)
      console.log(res);
   }
   async create(args: any) { }
   async update(args: any) { }
   async delete(args: any) { }
   async sync() {
      const schema = this.xansql.buildSchema(this)
   }
   async drop() { }
}


export default Model