import { XVDate } from "xanv"

class XqlDate extends XVDate {
   index() {
      this.meta.index = true
      return this
   }

   update() {
      this.meta.update = true
      this.default(() => new Date())
      return this
   }

   create() {
      this.meta.create = true
      this.index()
      this.default(() => new Date())
      return this
   }
}

export default XqlDate