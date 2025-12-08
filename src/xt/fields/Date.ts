import { XVDate } from "xanv"

class XqlDate extends XVDate {
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

   update() {
      this.set("update", () => { }, true)
      this.default(() => new Date())
      return this
   }

   create() {
      this.set("create", () => { }, true)
      this.index()
      this.default(() => new Date())
      return this
   }
}

export default XqlDate