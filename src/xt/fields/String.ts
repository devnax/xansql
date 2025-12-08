import { XVString } from "xanv"

class XqlString extends XVString {
   optional() {
      super.optional();
      super.nullable();
      return this;
   }
   index() {
      return this.set("index", () => { }, true)
   }

   text() {
      return this.set("text", () => { }, true)
   }

   unique() {
      return this.set("unique", () => { }, true)
   }

   email(): this {
      this.index()
      super.email()
      return this
   }
}

export default XqlString