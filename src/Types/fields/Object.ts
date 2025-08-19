import { XVObject } from "xanv"

class XqlObject extends XVObject {

   index() {
      this.meta.index = true
      return this
   }
}

export default XqlObject