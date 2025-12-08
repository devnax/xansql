import { XVBoolean } from "xanv"

class XqlBoolean extends XVBoolean {

   index() {
      return this.set("index", () => { }, true)
   }

   unique() {
      return this.set("unique", () => { }, true)
   }
}

export default XqlBoolean