import { XanvType } from "xanv";

class XqlAmount extends XanvType<any, number> {
   constructor() {
      super()
      this.index()
   }
   index() {
      this.meta.index = true
      return this
   }

   unique() {
      this.meta.unique = true
      return this
   }
   check(value: any): void {
      if (typeof value !== 'number') {
         throw new Error(`Value should be an amount, received ${typeof value}`);
      }
      const amountRegex = /^\d+(\.\d{1,2})?$/;
      if (!amountRegex.test(value as any)) {
         throw new Error(`Value should be a valid amount (up to two decimal places)`);
      }
   }

}

export default XqlAmount;