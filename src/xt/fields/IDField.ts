import { XVNumber } from "xanv"

class XqlIDField extends XVNumber {
   optional() {
      super.optional()
      return super.nullable();
   }
   nullable() {
      super.optional()
      return super.nullable();
   }
}

export default XqlIDField