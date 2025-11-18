import { XVJson } from "xanv"

class XqlJson extends XVJson {

   index() {
      this.meta.index = true
      return this
   }
}

export default XqlJson