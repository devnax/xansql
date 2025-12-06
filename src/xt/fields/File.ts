import { XVFile } from "xanv"

class XqlFile extends XVFile {

   index() {
      this.meta.index = true
      return this
   }
}

export default XqlFile