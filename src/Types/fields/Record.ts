import { XVRecord } from "xanv"

class XqlRecord extends XVRecord {

   index() {
      this.meta.index = true
      return this
   }
}

export default XqlRecord