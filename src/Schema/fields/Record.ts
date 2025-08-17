import { XVRecord } from "xanv"

class XqlRecord extends XVRecord {
   constraints = {
      index: false
   }
   index() {
      this.constraints.index = true
      return this
   }
}

export default XqlRecord