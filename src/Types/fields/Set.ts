import { XVSet } from "xanv"

class XqlSet extends XVSet {

   index() {
      this.meta.index = true
      return this
   }
}

export default XqlSet