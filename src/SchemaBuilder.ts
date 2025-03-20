import { TableName } from "./types";

class SchemaBuilder {
   table: TableName;
   constructor(table: TableName) {
      this.table = table;
   }
}


export default SchemaBuilder;