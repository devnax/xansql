import { Schema, Xansql } from "../..";

export type XansqlTransactionKey = string
export type XansqlTransactionValue = boolean

const state = new Map<XansqlTransactionKey, XansqlTransactionValue>();

class Transection {
   private xansql: Xansql

   constructor(xansql: Xansql) {
      this.xansql = xansql
   }

   async begin(model: Schema, args: any) {
      await model.execute('BEGIN;');
   }

   async commit() {
      this.committed = true;
   }

   async rollback() {
      this.rolledback = true;
   }
}

export default Transection;