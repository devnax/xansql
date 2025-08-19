import { XVBoolean } from "xanv"

class XqlBoolean extends XVBoolean {

   index() {
      this.meta.index = true
      return this
   }
}

export default XqlBoolean