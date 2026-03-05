import XqlString from "../fields/String";

class XqlPhone extends XqlString {
   constructor() {
      super();
      this.min(7).max(15)
   }

   phone() {
      return this.set("phone", (v: any) => {
         const phoneRegex = /^\+?[0-9]{7,15}$/;
         if (!phoneRegex.test(v)) {
            throw new Error("Invalid phone number format.");
         }
      });
   }

}

export default XqlPhone;