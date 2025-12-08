import { XVDate } from "xanv"

class XqlDate extends XVDate {
   index() {
      return this.set("index", () => { }, true)
   }

   unique() {
      return this.set("unique", () => { }, true)
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