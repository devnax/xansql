import XqlDate from "./Date"

class XqlCreatedAt extends XqlDate {

   constructor() {
      super()
      this.default(() => new Date())
      this.optional()
   }
}

export default XqlCreatedAt