import { XVFile } from "xanv"

class XqlFile extends XVFile {

   index() {
      return this.set("index", () => { }, true)
   }
}

export default XqlFile