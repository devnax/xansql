import { Xansql } from "../..";

export type XansqlTransactionKey = string
export type XansqlTransactionValue = boolean

class XansqlTransection {
   private xansql: Xansql
   private isBegin = false;
   // private commitTimer: NodeJS.Timeout | null = null;

   constructor(xansql: Xansql) {
      this.xansql = xansql
   }

   async begin() {
      if (!this.isBegin) {
         if (typeof window !== "undefined") {
            return
         }
         this.isBegin = true;
         await this.xansql.execute('BEGIN');
      }
   }

   async commit() {
      if (this.isBegin) {
         if (typeof window !== "undefined") {
            return
         }
         this.isBegin = false;
         await this.xansql.execute('COMMIT');
      }
   }

   async rollback() {
      if (this.isBegin) {
         if (typeof window !== "undefined") {
            return
         }
         this.isBegin = false;
         await this.xansql.execute('ROLLBACK');
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