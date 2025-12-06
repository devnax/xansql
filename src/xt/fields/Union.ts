import { XVUnion } from "xanv"

class XqlUnion extends XVUnion {

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

export default XqlUnion