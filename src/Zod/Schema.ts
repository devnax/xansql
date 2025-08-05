import callbacks from "./callbacks";
import { SchemaConstructorArg, SchemaObject } from "./types";

class Schema {
   table: string;
   private _schema: SchemaObject;
   constructor(table: string, schema: SchemaConstructorArg) {
      const schemaObject = schema(callbacks);
      this._schema = schemaObject;
      this.table = table;
   }
}

export default Schema;