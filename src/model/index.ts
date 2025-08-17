import xansql from "..";
import { Schema } from "../Schema";

class Model {

   constructor(readonly schema: Schema, readonly xansql: xansql) {
      this.schema = schema;
      this.xansql = xansql;

      let alias = schema.table.split('_').map((word: any) => word[0]).join('');
      const hasAlias = Object.values(xansql.models).some((model: any) => model.alias === alias);
      if (hasAlias) {
         alias = schema.table.split('_').map((word: any) => word.substring(0, 2)).join('');
      }
   }

   find() {
      console.log(this.schema)
   }

}

export default Model;