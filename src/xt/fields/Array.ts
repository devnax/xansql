import { XVArray } from "xanv"

class XqlArray extends XVArray {
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

export default XqlArray