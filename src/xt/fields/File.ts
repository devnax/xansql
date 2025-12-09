import { XVFile } from "xanv"

class XqlFile extends XVFile {
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

export default XqlFile