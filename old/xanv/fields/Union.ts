import { XVUnion } from "xanv"

class XqlUnion extends XVUnion {
   constraints = {
      index: false
   }
   index() {
      this.constraints.index = true
      return this
   }
}

export default XqlUnion