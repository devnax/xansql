import { XanvType } from "xanv";

class XqlUrl extends XanvType<any, string> {

   protected check(value: any): void {
      if (typeof value !== 'string') {
         throw new Error(`Value should be a url, received ${typeof value}`);
      }
      const urlRegex = /^(https?:\/\/)?([\w\-])+\.{1}([a-zA-Z]{2,63})([\/\w\-.?=&%+]*)*\/?$/;
      if (!urlRegex.test(value)) {
         throw new Error(`String should be a valid URL`);
      }
   }
}

export default XqlUrl;