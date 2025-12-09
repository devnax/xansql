import { XVArray } from "xanv"

class XqlArray extends XVArray {
   optional() {
      return super.optional().nullable();
   }
   index() {
      return this.set("index", () => { }, true)
   }
}

export default XqlArray