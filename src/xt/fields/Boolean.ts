import { XVBoolean } from "xanv"

class XqlBoolean extends XVBoolean {

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

export default XqlBoolean