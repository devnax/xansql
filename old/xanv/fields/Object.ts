import { XVObject } from "xanv"

class XqlObject extends XVObject {
   constraints = {
      index: false
   }
   index() {
      this.constraints.index = true
      return this
   }
}

export default XqlObject