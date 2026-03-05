import XqlString from "../fields/String";

class XqlUsername extends XqlString {
   constructor() {
      super();
      this.index().min(3).max(30).index().unique()
   }

   username() {
      return this.set("username", (v: any) => {
         const usernameRegex = /^[a-zA-Z0-9._-]{3,30}$/;
         if (!usernameRegex.test(v)) {
            throw new Error("Invalid username format.");
         }
      });
   }
}

export default XqlUsername;