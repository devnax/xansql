import { XVBoolean } from "xanv"

class XqlBoolean extends XVBoolean {
   constraints = {
      index: false
   }
   index() {
      this.constraints.index = true
      return this
   }
}

export default XqlBoolean