import { XVEnum } from "xanv"

class XqlEnum extends XVEnum {
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

export default XqlEnum