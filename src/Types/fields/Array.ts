import { XVArray } from "xanv"

class XqlArray extends XVArray {
   index() {
      this.meta.index = true
      return this
   }
}

export default XqlArray