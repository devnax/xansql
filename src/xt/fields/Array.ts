import { XVArray } from "xanv"

class XqlArray extends XVArray {
   index() {
      return this.set("index", () => { }, true)
   }
}

export default XqlArray