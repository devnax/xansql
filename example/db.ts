import SqliteDialect from "@xansql/sqlite-dialect";
import { Model, Xansql, XansqlFileMeta, xt } from "../src";
import MysqlDialect from "../src/dialects/Mysql";
import { ProductMetaModel, ProductModel, UserMetaModel, UserModel } from "./Schema";
import path from "path";
import fs from 'fs'

// const sqlite = SqliteDialect('db.sqlite')
let dir = 'uploads';

const mysql = MysqlDialect({
   host: "localhost",
   port: 3306,
   user: 'root',
   password: 'root1234',
   database: "xansql"
})

export const db = new Xansql({
   dialect: mysql as any,
   file: {
      upload: async (chunk: Uint8Array, filemeta: XansqlFileMeta, db: Xansql) => {
         const uploadDir = path.join(process.cwd(), dir);
         if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
         const filePath = path.join(uploadDir, filemeta.fileId);
         fs.appendFileSync(filePath, Buffer.from(chunk));
         return filemeta
      },
      delete: async (fileId: string) => {
         const fs = await import('fs');
         const path = await import('path');
         const filePath = path.join(process.cwd(), dir, fileId);
         if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
         }
      }
   },
})

export const User = db.model(UserModel)
export const UserMeta = db.model(UserMetaModel)
export const Product = db.model(ProductModel)
export const ProductMeta = db.model(ProductMetaModel)