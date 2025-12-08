import { XVObject } from "xanv"

class XqlObject extends XVObject {

   index() {
      return this.set("index", () => { }, true)
   }

   unique() {
      return this.set("unique", () => { }, true)
   }
}

export default XqlObject