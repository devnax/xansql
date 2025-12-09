import { XVBoolean } from "xanv"

class XqlBoolean extends XVBoolean {
   optional() {
      return super.optional().nullable();
   }
   index() {
      return this.set("index", () => { }, true)
   }

   unique() {
      return this.set("unique", () => { }, true)
   }
}

export default XqlBoolean