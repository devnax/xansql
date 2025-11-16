import { XanvType } from "xanv";

export type PasswordMeta = "strong"
class XqlPassowrd extends XanvType<PasswordMeta, string> {
   check(value: any): void {
      if (typeof value !== 'string') {
         throw new Error(`Value should be a string, received ${typeof value}`);
      }

      if (value.length < 8) {
         throw new Error('Password should be at least 8 characters long');
      }
   }

   strong() {
      this.set("strong", v => {
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

export default XqlPassowrd;