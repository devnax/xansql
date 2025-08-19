import { XVNumber } from "xanv"

class XqlNumber extends XVNumber {

   index() {
      this.meta.index = true
      return this
   }
   unique() {
      this.meta.unique = true
      return this
   }
}

export default XqlNumber