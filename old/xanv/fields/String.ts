import { XVString } from "xanv"

class XqlString extends XVString {
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

export default XqlString