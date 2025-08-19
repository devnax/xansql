import { XVEnum } from "xanv"

class XqlEnum extends XVEnum {

   index() {
      this.meta.index = true
      return this
   }
}

export default XqlEnum