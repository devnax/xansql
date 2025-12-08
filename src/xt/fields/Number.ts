import { XVNumber } from "xanv"

class XqlNumber extends XVNumber {

   index() {
      return this.set("index", () => { }, true)
   }
   unique() {
      return this.set("unique", () => { }, true)
   }
}

export default XqlNumber