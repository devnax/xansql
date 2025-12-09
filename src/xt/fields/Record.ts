import { XVRecord } from "xanv"

class XqlRecord extends XVRecord {
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

export default XqlRecord