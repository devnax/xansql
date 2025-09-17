import { XVDate } from "xanv"

class XqlDate extends XVDate {
   index() {
      this.meta.index = true
      return this
   }

   update() {
      this.meta.update = true
      return this
   }

   create() {
      this.meta.create = true
      this.index()
      return this
   }
}

export default XqlDate