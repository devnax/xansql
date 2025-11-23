import dotenv from 'dotenv'
import { Xansql, xt } from '../src'
import SqliteDialect from '../src/libs/SqliteDialect'
import FileInDirectory from '../src/libs/FileInDirectory';

if (typeof process !== 'undefined' && process?.env) {
   try {
      dotenv.config()
   } catch (e) {
      console.warn('dotenv failed to load:', e);
   }
}

const mysqlConn: string = (typeof process !== 'undefined' ? process.env.MYSQL_DB : 'mysql://root:root1234@localhost:3306/xansql') as string
const sqliteConn: string = 'db.sqlite'

export const db = new Xansql({
   dialect: SqliteDialect(sqliteConn),
   fetch: "http://localhost:4000/data",
   file: FileInDirectory({ dir: 'uploads' }),
})

export const ProductCategory = db.model("categories", {
   pcid: xt.id(),
   name: xt.string().index(),
   description: xt.string().optional(),
   post: xt.schema('products', "categories"),
})

export const UserModelMeta = db.model("user_metas", {
   uoid: xt.id(),
   meta_key: xt.string(),
   meta_value: xt.string(),
})

export const UserModel = db.model("users", {
   uid: xt.id(),
   name: xt.string(),
   username: xt.username().optional(),
   photo: xt.avatar().optional(),
   email: xt.email(),
   password: xt.password(),
   metas: xt.array(xt.schema("user_metas", "user")),
   created_at: xt.createdAt(),
   updated_at: xt.updatedAt(),
})

export const ProductModel = db.model("products", {
   pid: xt.id(),
   name: xt.string().index(),
   description: xt.string(),
   price: xt.string(),
   test: xt.string(2).optional(),
   categories: xt.array(xt.schema("categories", "post")),
   user: xt.schema("users", "products").optional(),
})

