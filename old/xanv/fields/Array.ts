import { XVArray } from "xanv"

class XqlArray extends XVArray {
   constraints = {
      index: false
   }
   index() {
      this.constraints.index = true
      return this
   }
}

export default XqlArray