import { XVRecord } from "xanv"

class XqlRecord extends XVRecord {

   index() {
      return this.set("index", () => { }, true)
   }

   unique() {
      return this.set("unique", () => { }, true)
   }
}

export default XqlRecord