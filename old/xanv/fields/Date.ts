import { XVDate } from "xanv"

class XqlDate extends XVDate {
   constraints = {
      index: false
   }
   index() {
      this.constraints.index = true
      return this
   }
}

export default XqlDate