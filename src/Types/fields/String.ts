import { XVString } from "xanv"

class XqlString extends XVString {

   index() {
      this.meta.index = true
      return this
   }
   unique() {
      this.meta.unique = true
      return this
   }
}

export default XqlString