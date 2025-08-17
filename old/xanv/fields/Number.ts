import { XVNumber } from "xanv"

class XqlNumber extends XVNumber {
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

export default XqlNumber