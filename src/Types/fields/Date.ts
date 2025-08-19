import { XVDate } from "xanv"

class XqlDate extends XVDate {

   index() {
      this.meta.index = true
      return this
   }
}

export default XqlDate