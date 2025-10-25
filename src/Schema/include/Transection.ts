import { Xansql } from "../..";


class Transection {
   private begined: boolean = false;
   private committed: boolean = false;
   private rolledback: boolean = false;
   private xansql: Xansql

   constructor(xansql: Xansql) {
      this.xansql = xansql
   }

   async begin() {
      this.begined = true;
      await this.xansql.execute('BEGIN TRANSACTION;');
   }

   async commit() {
      this.committed = true;
   }

   async rollback() {
      this.rolledback = true;
   }
}

export default Transection;