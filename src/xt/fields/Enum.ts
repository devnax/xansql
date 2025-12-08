import { XVEnum } from "xanv"

class XqlEnum extends XVEnum {

   index() {
      return this.set("index", () => { }, true)
   }

   unique() {
      return this.meta.unique = true
   }
}

export default XqlEnum