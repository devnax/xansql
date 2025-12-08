import { XVArray } from "xanv"

class XqlArray extends XVArray {
   optional() {
      super.optional();
      super.nullable();
      return this;
   }
   index() {
      return this.set("index", () => { }, true)
   }
}

export default XqlArray