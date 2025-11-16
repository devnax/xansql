import { XanvType } from "xanv";

class XqlEmail extends XanvType<"email", string> {


   protected check(value: any): void {
      if (typeof value !== 'string') {
         throw new Error(`Value should be an email, received ${typeof value}`);
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
         throw new Error(`String should be a valid email address`);
      }
   }

}

export default XqlEmail;