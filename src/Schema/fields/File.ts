import { XVFile } from "xanv"

class XqlFile extends XVFile {
   constraints = {
      index: false
   }
   index() {
      this.constraints.index = true
      return this
   }
}

export default XqlFile