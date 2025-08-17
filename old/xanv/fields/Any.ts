import { XVAny } from "xanv"

class XqlAny extends XVAny {
   constraints = {
      index: false,
      unique: false,
   }
   index() {
      this.constraints.index = true
      return this
   }
   unique() {
      this.constraints.unique = true
      return this
   }
}

export default XqlAny