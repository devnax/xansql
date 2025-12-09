import { XVDate } from "xanv"

class XqlDate extends XVDate {
   optional() {
      return super.optional().nullable();
   }

   index() {
      return this.set("index", () => { }, true)
   }

   unique() {
      return this.set("unique", () => { }, true)
   }

   update() {
      return this.set("update", () => { }, true).default(() => new Date())
   }

   create() {
      return this.index().default(() => new Date()).set("create", () => { }, true)
   }
}

export default XqlDate