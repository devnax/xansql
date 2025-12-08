import { XVUnion } from "xanv"

class XqlUnion extends XVUnion {

   index() {
      return this.set("index", () => { }, true)
   }

   unique() {
      return this.set("unique", () => { }, true)
   }
}

export default XqlUnion