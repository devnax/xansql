import { XVTuple } from "xanv"

class XqlTuple extends XVTuple {

   index() {
      this.meta.index = true
      return this
   }
}

export default XqlTuple