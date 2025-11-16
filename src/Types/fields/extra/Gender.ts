import { XanvType } from "xanv";

class XqlGender extends XanvType<"gender", string> {

   check(value: any): void {
      const values: any = ["male", "female", "other"];
      if (typeof value !== 'string' || !values.includes(value)) {
         throw new Error(`Gender should be one of the following types: ${values.join(', ')}, received ${typeof value}`);
      }
   }
}

export default XqlGender;