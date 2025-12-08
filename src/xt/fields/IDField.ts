import { XVNumber } from "xanv"

class XqlIDField extends XVNumber {
   optional() {
      super.optional();
      super.nullable();
      return this;
   }
}

export default XqlIDField