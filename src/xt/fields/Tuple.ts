import { XVTuple } from "xanv"

class XqlTuple extends XVTuple {
   index() {
      return this.set("index", () => { }, true)
   }

   unique() {
      return this.set("unique", () => { }, true)
   }
}

export default XqlTuple