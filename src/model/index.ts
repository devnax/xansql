import xansql from "..";
import Column from "../schema/Column";
import Relation from "../schema/Relation";
import { SchemaMap } from "../schema/types";
import { TableName } from "../types";
import { FindOptions } from "./types";

class Model<Data extends object = any> {
   table: TableName | null = null;
   schemaSQL: string | null = null;
   private xansql: xansql;
   constructor(xansql: xansql) {
      this.table = this.table || this.constructor.name.toLowerCase();
      this.xansql = xansql;
   }


   schema(): SchemaMap {
      throw new Error("Method not implemented.");
   }

   async create(data: Partial<Data>) {
      console.log(data)
   }

   async find(args: FindOptions) {
      const { take, skip, orderBy, where, select } = args;
      const raw_schema = this.schema();

      for (let wk in where) {
         if (!raw_schema[wk]) {
            throw new Error(`Invalid field ${wk} in where clause`);
         }

         const rawfield = raw_schema[wk];
         const field = where[wk];

         if (rawfield instanceof Column) {
            if (field instanceof Object) {
               // field is a condition
            } else {
               // field is a value
            }
         } else if (rawfield instanceof Relation) {
            const relTable = rawfield.table
            const relColumn = rawfield.column
            if (!relTable) {
               // single relation
            } else {
               // multiple relation
            }
         } else {
            throw new Error(`Invalid field ${wk} in where clause`);
         }
      }
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