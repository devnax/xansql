import { XVTuple } from "xanv"

class XqlTuple extends XVTuple {
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

   unique() {
      return this.set("unique", () => { }, true)
   }
}

export default XqlTuple