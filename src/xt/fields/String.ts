import { XVString } from "xanv"

class XqlString extends XVString {

   index() {
      this.meta.index = true
      return this
   }

   text() {
      this.meta.text = true
      return this
   }

   unique() {
      this.meta.unique = true
      this.index()
      return this
   }

   email(): this {
      this.index()
      super.email()
      return this
   }
}

export default XqlString