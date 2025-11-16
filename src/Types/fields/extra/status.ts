import { XanvType, XVEnumValues } from "xanv";

class XqlStatus extends XanvType<"email", string> {
   private values: XVEnumValues = [];

   constructor(values: XVEnumValues) {
      super();
      if (!Array.isArray(values) || values.length === 0) {
         throw new Error("Status must be a non-empty array");
      }
      this.values = values;
   }

   check(value: any): void {
      if (typeof value !== 'string' && typeof value !== 'number') {
         throw new Error(`Status value should be a string or number, received ${typeof value}`);
      }

      if (!this.values.includes(value)) {
         throw new Error(`Value should be one of the status values: ${this.values.join(', ')}`);
      }
   }

}

export default XqlStatus;