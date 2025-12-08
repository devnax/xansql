import { XVUnion } from "xanv"

class XqlUnion extends XVUnion {
   optional() {
      super.optional();
      super.nullable();
      return this;
   }
   index() {
      return this.set("index", () => { }, true)
   }

   unique() {
      return this.set("unique", () => { }, true)
   }
}

export default XqlUnion