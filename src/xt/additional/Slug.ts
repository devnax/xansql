import XqlString from "../fields/String";

class XqlSlug extends XqlString {
   constructor() {
      super();
      this.index().min(3).max(255)
   }

   slug() {
      return this.set("slug", (v: any) => {
         const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
         if (!slugRegex.test(v)) {
            throw new Error("Invalid slug format.");
         }
      });
   }
}

export default XqlSlug;