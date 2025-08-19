import { XVUnion } from "xanv"

class XqlUnion extends XVUnion {

   index() {
      this.meta.index = true
      return this
   }
}

export default XqlUnion