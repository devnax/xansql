import { Xansql } from "../..";

export type XansqlTransactionKey = string
export type XansqlTransactionValue = boolean

class XansqlTransection {
   private xansql: Xansql
   private isBegin = false;

   constructor(xansql: Xansql) {
      this.xansql = xansql
   }

   async begin() {
      if (!this.isBegin) {
         await this.xansql.dialect.execute('BEGIN');
      }
   }

   async commit() {
      if (this.isBegin) {
         await this.xansql.dialect.execute('COMMIT');
      }
   }

   async rollback() {
      if (this.isBegin) {
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