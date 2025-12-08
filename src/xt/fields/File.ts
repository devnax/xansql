import { XVFile } from "xanv"

class XqlFile extends XVFile {
   optional() {
      super.optional();
      super.nullable();
      return this;
   }
   index() {
      return this.set("index", () => { }, true)
   }
}

export default XqlFile