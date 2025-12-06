import { XVObject } from "xanv"

class XqlObject extends XVObject {

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

export default XqlObject