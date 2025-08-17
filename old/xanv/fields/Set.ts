import { XVSet } from "xanv"

class XqlSet extends XVSet {
   constraints = {
      index: false
   }
   index() {
      this.constraints.index = true
      return this
   }
}

export default XqlSet