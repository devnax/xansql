import XqlDate from "./Date"

class XqlUpdatedAt extends XqlDate {
   constructor() {
      super()
      this.default(() => new Date())
      this.optional()
   }
}

export default XqlUpdatedAt