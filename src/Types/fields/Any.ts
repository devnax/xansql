import { XVAny } from "xanv"

class XqlAny extends XVAny {

   index() {
      this.meta.index = true
      return this
   }
   unique() {
      this.meta.unique = true
      return this
   }
}

export default XqlAny