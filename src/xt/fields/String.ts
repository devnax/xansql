import { XVString } from "xanv"

class XqlString extends XVString {
   optional() {
      super.optional()
      return super.nullable();
   }
   nullable() {
      super.optional()
      return super.nullable();
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
      return super.email()
   }
}

export default XqlString