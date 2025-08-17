import { XVEnum } from "xanv"

class XqlEnum extends XVEnum {
   constraints = {
      index: false
   }
   index() {
      this.constraints.index = true
      return this
   }
}

export default XqlEnum