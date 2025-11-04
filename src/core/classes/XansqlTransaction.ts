import { Xansql } from "../..";

export type XansqlTransactionKey = string
export type XansqlTransactionValue = boolean

class XansqlTransection {
   private xansql: Xansql
   private isBegin = false;
   private commitTimer: NodeJS.Timeout | null = null;

   constructor(xansql: Xansql) {
      this.xansql = xansql
   }

   async begin() {
      if (!this.isBegin) {
         this.isBegin = true;
         await this.xansql.dialect.execute('BEGIN');
      }
   }

   async commit() {
      if (this.isBegin) {
         if (this.commitTimer) clearTimeout(this.commitTimer);
         this.commitTimer = setTimeout(async () => {
            this.isBegin = false;
            await this.xansql.dialect.execute('COMMIT');
         }, 10);
      }
   }

   async rollback() {
      if (this.isBegin) {
         this.isBegin = false;
         if (this.commitTimer) clearTimeout(this.commitTimer);
         await this.xansql.dialect.execute('ROLLBACK');
      }
   }

   async transaction(callback: () => Promise<any>): Promise<any> {
      try {
         await this.begin();
         const result = await callback();
         await this.commit();
         return result;
      } catch (error) {
         await this.rollback();
         throw error;
      }
   }
}

export default XansqlTransection;