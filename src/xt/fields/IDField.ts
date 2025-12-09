import { XVNumber } from "xanv"

class XqlIDField extends XVNumber {
   optional() {
      return super.optional().nullable();
   }
}

export default XqlIDField