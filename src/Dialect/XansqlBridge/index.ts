import { SecurequClient } from "securequ";
import { ExecuterResult, XansqlDialectEngine, XansqlFileMeta } from "../../core/types";
import Xansql from "../../core/Xansql";
import { makePath, makeSecret, sqlparser } from "./base";
import XansqlError from "../../core/XansqlError";


const XansqlBridge = (url: string, engine?: XansqlDialectEngine) => {

   let clientInstance: SecurequClient | null = null;
   const getClient = async (xansql: Xansql) => {
      if (!clientInstance) {
         const secret = await makeSecret(xansql)
         clientInstance = new SecurequClient({
            secret,
            url
         });
      }
      return clientInstance;
   }

   const execute = async (sql: string, xansql: Xansql): Promise<ExecuterResult> => {
      if (typeof window === 'undefined') {
         throw new XansqlError({
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
            throw new XansqlError(res.message);
         }
         return res.data || null
      } else if (meta.action === "INSERT") {
         let res = await client.post(await makePath('insert', xansql), { body: data })
         if (!res.success) {
            throw new XansqlError(res.message);
         }
         return res.data || null
      } else if (meta.action === "UPDATE") {
         let res = await client.put(await makePath('update', xansql), { body: data })
         if (!res.success) {
            throw new XansqlError(res.message);
         }
         return res.data || null
      } else if (meta.action === "DELETE") {
         let res = await client.delete(await makePath('delete', xansql), { params: data })
         if (!res.success) {
            throw new XansqlError(res.message);
         }
         return res.data || null
      } else {
         let res = await client.post(await makePath('executer', xansql), { body: data })
         if (!res.success) {
            throw new XansqlError(res.message);
         }
         return res.data || null
      }
   };

   const getSchema = async (xansql: Xansql) => {
      const client = await getClient(xansql)
      const res = await client.get(await makePath('raw_schema', xansql))
      if (!res.success) {
         throw new XansqlError({
            message: `Failed to fetch schema: ${res.message || 'Unknown error'}`
         })
      }
      return res.data
   };

   const uploadFile = async (file: File, xansql: Xansql): Promise<XansqlFileMeta> => {
      const client = await getClient(xansql);
      const res = await client.uploadFile(file);
      return res.data
   }

   const deleteFile = async (fileId: string, xansql: Xansql) => {
      const client = await getClient(xansql);
      await client.deleteFile(fileId);
   }

   return {
      engine: engine || 'mysql',
      execute,
      getSchema,
      file: {
         upload: uploadFile,
         delete: deleteFile
      }
   };
};

export default XansqlBridge;
