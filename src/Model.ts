import xansql from ".";
import SchemaBuilder from "./SchemaBuilder";
import { TableName } from "./types";

const Model = (table: TableName, xansql: xansql) => {

   return class Model {
      static xansql = xansql
      static table: TableName = table

      static schema(schema: SchemaBuilder): void {
         throw new Error("Method not implemented.");
      }

      static async sync(force?: boolean) {
         const item = xansql.factory.get(table)
         console.log(item);

      }

      static async create(data: any) {
         console.log(data)
      }

      static async find() {
         console.log('Find all')
      }

      static async findOne() {
         console.log('Find one')
      }

      static async update(data: any) {
         console.log(data)
      }

      static async delete() {
         console.log('Delete')
      }

   }
}

export default Model;