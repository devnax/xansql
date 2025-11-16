import { XanvType } from "xanv";

class XqlSlug extends XanvType<any, string> {
   constructor() {
      super()
      this.unique()
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
      if (typeof value !== 'string') {
         throw new Error(`Value should be a slug, received ${typeof value}`);
      }
      const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
      if (!slugRegex.test(value)) {
         throw new Error(`String should be a valid slug (lowercase letters, numbers, hyphens)`);
      }
   }

}

export default XqlSlug;