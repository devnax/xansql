import { XVNumber } from "xanv"

class XqlIDField extends XVNumber {
   constraints = {
      index: false,
   }
   index() {
      this.constraints.index = true
      return this
   }
}

export default XqlIDField