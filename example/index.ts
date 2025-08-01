import xansql from "../src"
import UserModel, { UserData } from "./models/User"
import UserMetaModel from "./models/UserMeta"
import ProductModel from "./models/Product"
import CategoryModel from "./models/Category"
import mysqldialect from "../src/dialects/Mysql"
import SqliteDialect from "../src/dialects/Sqlite"
import dotenv from 'dotenv'
import TestCache from "./TestCache"

if (typeof process !== 'undefined' && process?.env) {
   try {
      dotenv.config()
   } catch (e) {
      console.warn('dotenv failed to load:', e);
   }
}

const mysqlConn: string = (typeof process !== 'undefined' ? process.env.MYSQL_DB : 'mysql://root:password@localhost:3306/xansql') as string
const sqliteConn: string = 'db.sqlite'

const conn = {
   mysql: {
      connection: mysqlConn,
      dialect: mysqldialect
   },
   sqlite: {
      connection: sqliteConn,
      dialect: SqliteDialect
   }
}

export const db = new xansql({
   ...conn.mysql,
   cachePlugins: [
      // TestCache
   ],
   client: {
      basepath: '/data'
   }
})

export const UserMeta = db.registerModel(UserMetaModel)
export const Product = db.registerModel(ProductModel)
export const Category = db.registerModel(CategoryModel)
export const User = db.registerModel<UserData>(UserModel)