import { Schema, Xansql } from "../src";
import { XansqlCachePlugin } from "../src/type";

const TestCache: XansqlCachePlugin = async (xansql: Xansql) => {
   const models = new Map<string, any>();

   return {
      cache: async (sql: string, model: Schema) => {
         if (!models.has(model.table)) {
            models.set(model.table, new Map());
         }
         const data = models.get(model.table);
         if (data.has(sql)) {
            return data.get(sql);
         }
      },
      onFind: async (sql: string, model: Schema, result) => {
         if (!models.has(model.table)) {
            models.set(model.table, new Map());
         }
         const tableData = models.get(model.table);
         // tableData.set(sql, result);
      },
      onCreate: async (model, insertId) => {
         if (!models.has(model.table)) {
            models.set(model.table, new Map());
         }
         const tableData = models.get(model.table);
         tableData.clear();
      },
      onUpdate: async (model, rows) => {
         if (!models.has(model.table)) {
            models.set(model.table, new Map());
         }
         const tableData = models.get(model.table);
         tableData.clear();
      },
      onDelete: async (model, rows) => {
      },
      clear: async (model) => {
         console.log("onDestroy");
      }
   }
}

export default TestCache;