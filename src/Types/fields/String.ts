import { XVString } from "xanv"

class XqlString extends XVString {

   index() {
      this.meta.index = true
      return this
   }

   text() {
      this.meta.text = true
      return this
   }

   unique() {
      this.meta.unique = true
      this.index()
      return this
   }

   email(): this {
      this.index()
      super.email()
      return this
   }

   username(): this {
      this.set("username" as any, (v: any) => {
         const usernameRegex = /^[a-zA-Z0-9._-]{3,30}$/;
         if (!usernameRegex.test(v)) {
            throw new Error("Invalid username format.");
         }
      });
      this.index()
      return this
   }
}

export default XqlString