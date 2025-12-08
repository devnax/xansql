import sha256 from "../../utils/sha256";
import XqlString from "../fields/String";

class XqlPassword extends XqlString {
   constructor() {
      super();
      this.min(8).max(64).index().transform(v => sha256(v).slice(0, 64))
   }

   strong() {
      return this.set("strong", (v: any) => {
         const hasUpperCase = /[A-Z]/.test(v);
         const hasLowerCase = /[a-z]/.test(v);
         const hasNumber = /[0-9]/.test(v);
         const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(v);
         if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
            throw new Error('Password should contain at least one uppercase letter, one lowercase letter, one number, and one special character');
         }
      });
   }
}

export default XqlPassword;