import Xansql from "../Xansql"

class XansqlTransaction {
   private xansql: Xansql
   private active = false
   private commitTimer: NodeJS.Timeout | null = null

   constructor(xansql: Xansql) {
      this.xansql = xansql
   }

   async begin() {
      clearTimeout(this.commitTimer!)
      if (!this.active) {
         this.active = true
         await this.xansql.execute("BEGIN")
      }
   }

   async commit() {
      this.commitTimer = setTimeout(async () => {
         if (!this.active) return
         this.active = false
         await this.xansql.execute("COMMIT")
      }, 0)
   }

   async rollback() {
      this.commitTimer = setTimeout(async () => {
         if (!this.active) return
         this.active = false
         await this.xansql.execute("ROLLBACK")
      }, 0)
   }
}

export default XansqlTransaction