import { XVEnum } from "xanv"

class XqlEnum extends XVEnum {

   index() {
      this.meta.index = true
      return this
   }

   unique() {
      this.meta.unique = true
      return this
   }
}

export default XqlEnum