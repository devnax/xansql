import { SecurequClient } from "securequ";
import { makePath, makeSecret, sqlparser } from "./base";
import { ExecuterResult, XansqlDialectEngine, XansqlFileMeta } from "../../core/types";
import Xansql from "../../core/Xansql";
import XansqlError from "../../core/XansqlError";

const XansqlBridgeDialect = (url: string, engine?: XansqlDialectEngine) => {

   let instance: SecurequClient | null = null;
   const getClient = async (xansql: Xansql) => {
      if (!instance) {
         const secret = await makeSecret(xansql)
         instance = new SecurequClient({ secret, url });
      }
      return instance;
   }

   const execute = async (sql: string, xansql: Xansql): Promise<ExecuterResult> => {
      if (typeof window === 'undefined') {
         throw new XansqlError({
            code: "INTERNAL_ERROR",
            message: "XansqlBridge dialect can only be used in browser environment.",
         })
      }
      const client = await getClient(xansql)
      const meta = sqlparser(sql);
      const data = {
         sql,
         table: meta.table,
         action: meta.action,
      };

      if (meta.action === "SELECT") {
         let res = await client.get(await makePath('find', xansql), { params: data })
         if (!res.success) {
            throw new XansqlError({
               code: "QUERY_ERROR",
               message: res.message
            });
         }
         return res.data || null

      } else if (meta.action === "INSERT") {
         let res = await client.post(await makePath('insert', xansql), { body: data })
         if (!res.success) {
            throw new XansqlError({
               code: "QUERY_ERROR",
               message: res.message
            });
         }
         return res.data || null
      } else if (meta.action === "UPDATE") {
         let res = await client.put(await makePath('update', xansql), { body: data })
         if (!res.success) {
            throw new XansqlError({
               code: "QUERY_ERROR",
               message: res.message
            });
         }
         return res.data || null
      } else if (meta.action === "DELETE") {
         let res = await client.delete(await makePath('delete', xansql), { params: data })
         if (!res.success) {
            throw new XansqlError({
               code: "QUERY_ERROR",
               message: res.message
            });
         }
         return res.data || null
      } else {

         let res = await client.post(await makePath('executer', xansql), { body: data })
         if (!res.success) {
            throw new XansqlError({
               code: "QUERY_ERROR",
               message: res.message
            });
         }
         return res.data || null
      }
   };

   const uploadFile = async (chunk: Uint8Array, meta: XansqlFileMeta, xansql: Xansql): Promise<XansqlFileMeta> => {
      const client = await getClient(xansql);
      const res = await client.uploadFile({
         chunk,
         meta
      });
      return res.data
   }

   const deleteFile = async (fileId: string, xansql: Xansql) => {
      const client = await getClient(xansql);
      await client.deleteFile(fileId);
   }

   return {
      dialect: {
         engine: engine || 'mysql',
         execute,
      },
      file: {
         upload: uploadFile,
         delete: deleteFile
      }
   };
};


export default XansqlBridgeDialect;
