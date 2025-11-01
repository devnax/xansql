import { XVRecord } from "xanv"

class XqlRecord extends XVRecord {

   index() {
      this.meta.index = true
      return this
   }

   unique() {
      this.meta.unique = true
      this.index()
      return this
   }
}

export default XqlRecord