import { XVNumber } from "xanv"

class XqlIDField extends XVNumber {
   index() {
      this.meta.index = true
      return this
   }
}

export default XqlIDField