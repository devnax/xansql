import { compresor } from "securequ";
import { Schema, Xansql, xt } from "../../src";
import { XansqlCachePlugin } from "../../src/type";
import InMemoryCache from "./InMemory";


const XansqlCache: XansqlCachePlugin = async (xansql: Xansql) => {
   const models = new Map<string, any>();
   const isClient = typeof window !== 'undefined' && typeof window.document !== 'undefined';
   const tableOfCaches = new Map<string, InMemoryCache>();
   const limit = 1000;

   if (!xansql.log) {
      throw new Error("XansqlCache plugin requires logging to be enabled in Xansql configuration.");
   }

   return {
      cache: async (sql: string, model: Schema) => {
         if (!tableOfCaches.has(model.table)) {
            tableOfCaches.set(model.table, new InMemoryCache(limit));
         }

         const memoryCache = tableOfCaches.get(model.table) as InMemoryCache;
         const im = memoryCache.get(sql);
         if (im) {
            const data = await compresor.decompress(im) as { logId: number, result: any[] };
            const logs = await xansql.log?.find({
               where: {
                  id: { gt: data.logId },
                  model: model.table,
                  expires_at: { gt: Date.now() }
               },
               orderBy: { [xansql.log.IDColumn]: 'asc' },
               limit: { take: 10 },
               select: {
                  [xansql.log.IDColumn]: true,
                  rows: true,
                  action: true
               }
            });

            console.log(logs)

            if (logs.length) {
               for (let log of logs) {
                  if (log.action === 'create') {

                  } else if (log.action === 'update') {
                     // const updatedRows = JSON.parse(log.rows || '[]');
                     // for (let updatedRow of updatedRows) {
                     //    const index = data.result.findIndex(r => r[model.IDColumn] === updatedRow[model.IDColumn]);
                     //    if (index > -1) {
                     //       data.result[index] = {
                     //          ...data.result[index],
                     //          ...updatedRow
                     //       }
                     //    }
                     // }
                  } else if (log.action === 'delete') {
                     // const deletedRows = JSON.parse(log.rows || '[]');
                     // for (let deletedRow of deletedRows) {
                     //    const index = data.result.findIndex(r => r[model.IDColumn] === deletedRow[model.IDColumn]);
                     //    if (index > -1) {
                     //       data.result.splice(index, 1);
                     //    }
                     // }
                  }
               }
            }

            return data.result;
         }

         if (isClient) {
            // indexedDB
         } else {
            // sqlite
         }
      },
      onFind: async (sql: string, model: Schema, result) => {
         if (!tableOfCaches.has(model.table)) {
            tableOfCaches.set(model.table, new InMemoryCache(limit));
         }
         const data = {
            logId: 0,
            result
         }
         const memoryCache = tableOfCaches.get(model.table) as InMemoryCache;
         memoryCache.set(sql, await compresor.compress(data));

         if (isClient) {
            // indexedDB
         } else {
            // sqlite
         }
      },
      onCreate: async (model, insertId) => {

      },
      onUpdate: async (model, rows) => {

      },
      onDelete: async (model, rows) => {

      },
      clear: async (model) => {
         if (tableOfCaches.has(model.table)) {
            tableOfCaches.delete(model.table);
         }

      }
   }
}

export default XansqlCache;