import xansql from ".";
import Schema from "./schema";
import { SchemaMap } from "./schema/types";
import { TableName } from "./types";

class Model {
   table: TableName | null = null;
   private xansql: xansql;
   constructor(xansql: xansql) {
      this.table = this.table || this.constructor.name.toLowerCase();
      this.xansql = xansql;
   }
   schema(): SchemaMap {
      throw new Error("Method not implemented.");
   }

   async create(data: any) {
      console.log(data)
   }

   async find() {
      let sql = ""

   }

   async findOne() {
      console.log('Find one')
   }

   async update(data: any) {
      console.log(data)
   }

   async delete() {
      console.log('Delete')
   }
}

export default Model;