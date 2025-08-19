import { XVMap } from "xanv"

class XqlMap extends XVMap {

   index() {
      this.meta.index = true
      return this
   }
}

export default XqlMap