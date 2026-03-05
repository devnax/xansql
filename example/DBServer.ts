import dotenv from 'dotenv'
import { Xansql, XansqlFileMeta, xt } from '../src'
import SqliteDialect from '@xansql/sqlite-dialect'
import MysqlDialect from '@xansql/mysql-dialect'
// import { ProductCategorySchema, ProductMetaSchema, ProductModelSchema, UserModelMetaSchema, UserModelSchema } from './Schema';
import fs from 'fs'
import path from 'path'
dotenv.config()

const mysqlConn: string = (typeof process !== 'undefined' ? process.env.MYSQL_DB : 'mysql://root:root1234@localhost:3306/xansql') as string
const sqliteConn: string = 'db.sqlite'
let dir = 'uploads';

const mysql = MysqlDialect({
   host: "localhost",
   port: 3306,
   user: 'root',
   password: 'root1234',
   database: "xansql",
   // file: {
   //    upload: async (file: File, xansql: Xansql) => {

   //    },
   //    delete: async (fileId: string) => {
   //       const fs = await import('fs');
   //       const path = await import('path');
   //       const filePath = path.join(process.cwd(), dir, fileId);
   //       if (fs.existsSync(filePath)) {
   //          fs.unlinkSync(filePath);
   //       }
   //    }
   // }
})

const sqlite = SqliteDialect('db.sqlite')

export const db = new Xansql({
   dialect: mysql as any,
})


// export const User = db.model("users", () => ({
//    id: xt.id(),
//    products: xt.many("Product").target("user"), // 
// }))

// export const Product = db.model("users", () => ({
//    id: xt.id(),
//    user: xt.one("User").target("products")
// }))

// export const Profile = db.model("users", () => ({
//    id: xt.id(),
//    // user: xt.one(User).target("profile")
// })


// export const ProductModel = db.model("products", ProductModelSchema)
// export const ProductCategory = db.model("categories", ProductCategorySchema)
// export const UserModelMeta = db.model("user_metas", UserModelMetaSchema)
// export const ProductMetaModel = db.model("metas", ProductMetaSchema)
