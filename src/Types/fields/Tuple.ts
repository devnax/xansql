import { XVTuple } from "xanv"

class XqlTuple extends XVTuple {
   index() {
      this.meta.index = true
      return this
   }

   unique() {
      this.meta.unique = true
      this.index()
      return this
   }
}

export default XqlTuple