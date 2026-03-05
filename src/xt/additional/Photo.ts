import XqlFile from "../fields/File";

class XqlPhoto extends XqlFile {
   constructor() {
      super();
      this.maxsize(2 * 1024 * 1024) // 2 MB
   }

   photo() {
      return this.set("photo", (v: any) => {
         const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
         if (!allowedTypes.includes(v.type)) {
            throw new Error("Invalid photo file type.");
         }
      });
   }
}

export default XqlPhoto;