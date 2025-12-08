import { XVString } from "xanv"

class XqlString extends XVString {

   index() {
      return this.set("index", () => { }, true)
   }

   text() {
      this.meta.text = true
      return this
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