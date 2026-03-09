class XansqlTransaction {
   private active: boolean = false;
   private xansql: any; // your Xansql instance

   constructor(xansql: any) {
      this.xansql = xansql;
   }

   /**
    * Begin a transaction
    */
   async begin() {
      if (this.active) return; // already active
      await this.xansql.execute("BEGIN");
      this.active = true;
   }

   /**
    * Commit the transaction immediately
    */
   async commit() {
      if (!this.active) return;
      await this.xansql.execute("COMMIT");
      this.active = false;
   }

   /**
    * Rollback the transaction immediately
    */
   async rollback() {
      if (!this.active) return;
      await this.xansql.execute("ROLLBACK");
      this.active = false;
   }

   /**
    * Run a function inside the transaction safely
    * Automatically commits or rolls back if there’s an error
    */
   async run<T>(fn: () => Promise<T>): Promise<T> {
      await this.begin();
      try {
         const result = await fn();
         await this.commit();
         return result;
      } catch (err) {
         await this.rollback();
         throw err;
      }
   }
}

export default XansqlTransaction;