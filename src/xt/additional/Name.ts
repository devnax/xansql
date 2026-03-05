import XqlString from "../fields/String";

class XqlName extends XqlString {
   constructor() {
      super();
      this.min(1).max(100)
   }

   name() {
      return this.set("name", (v: any) => {
         const nameRegex = /^[a-zA-Z\s'-]+$/;
         if (!nameRegex.test(v)) {
            throw new Error("Invalid name format.");
         }
      });
   }
}

export default XqlName;