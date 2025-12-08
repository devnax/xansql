import XqlString from "../fields/String";

class XqlUrl extends XqlString {
   constructor() {
      super();
      this.max(2048).min(10)
   }

   url() {
      return this.set("url", (v: any) => {
         try {
            const url = new URL(v);
            if (!['http:', 'https:'].includes(url.protocol)) {
               throw new Error("URL must start with http:// or https://");
            }
         } catch (e) {
            throw new Error("Invalid URL format.");
         }
      });
   }
}

export default XqlUrl;