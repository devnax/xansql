import { XVTuple } from "xanv"

class XqlTuple extends XVTuple {
   constraints = {
      index: false
   }
   index() {
      this.constraints.index = true
      return this
   }
}

export default XqlTuple