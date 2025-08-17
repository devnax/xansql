import { XVMap } from "xanv"

class XqlMap extends XVMap {
   constraints = {
      index: false
   }
   index() {
      this.constraints.index = true
      return this
   }
}

export default XqlMap