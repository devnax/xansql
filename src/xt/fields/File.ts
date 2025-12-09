import { XVFile } from "xanv"

class XqlFile extends XVFile {
   optional() {
      return super.optional().nullable();
   }
   index() {
      return this.set("index", () => { }, true)
   }
}

export default XqlFile