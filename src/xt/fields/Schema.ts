import { XanvType } from "xanv";
import { isObject } from "../../utils";

class XqlSchema extends XanvType<any> {
   type = "schema";
   readonly table: string;
   readonly column: string;
   dynamic = false;

   relation = {
      main: "",
      target: ""
   }

   constructor(table: string, column: string) {
      super();
      this.table = table;
      this.column = column;
      this.index();
   }

   protected check(value: any) {

      let msg = `Value must be a positive integer or an ${this.table} object`;
      if (Number.isInteger(value)) {
         if (value <= 0) {
            throw new Error(msg);
         }
      } else if (isObject(value)) {
         if (!(this.relation.main in value)) {
            throw new Error(msg);
         }
         const id = value[this.relation.main];
         if (!Number.isInteger(id) || id <= 0) {
            throw new Error("ID must be a positive integer");
         }
      } else {
         throw new Error(msg);
      }
   }

   optional() {
      super.optional()
      return super.nullable();
   }
   nullable() {
      super.optional()
      return super.nullable();
   }

   index() {
      return this.set("index", () => { }, true)
   }

}

export default XqlSchema