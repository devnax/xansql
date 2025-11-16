import { XanvType } from "xanv";

class XqlUsername extends XanvType<"username", string> {

   protected check(value: any): void {
      if (typeof value !== 'string') {
         throw new Error(`Value should be a username, received ${typeof value}`);
      }

      const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
      if (!usernameRegex.test(value)) {
         throw new Error(`String should be a valid username (3-30 characters, letters, numbers, underscores)`);
      }
   }

}

export default XqlUsername;