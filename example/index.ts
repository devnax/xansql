import xansql from "../src"
import UserModel, { UserData } from "./models/User"
import UserMetaModel from "./models/UserMeta"
import ProductModel from "./models/Product"
import CategoryModel from "./models/Category"
import mysqldialect from "../src/dialects/Mysql"
import dotenv from 'dotenv'
import TestCache from "./TestCache"

if (typeof process !== 'undefined' && process?.env) {
   try {
      dotenv.config()
   } catch (e) {
      console.warn('dotenv failed to load:', e);
   }
}

const conn: string = (typeof process !== 'undefined' ? process.env.MYSQL_DB : 'http://localhost:3000/data') as string

let mysql: any = {
   dialect: 'mysql',
   connection: conn
}

let sqlite: any = {
   dialect: 'sqlite',
   connection: 'db.sqlite'
}
export const db = new xansql({
   connection: conn,
   dialect: mysqldialect,
   cachePlugins: [
      TestCache
   ],
   client: {
      basepath: '/data'
   }
})
export const UserMeta = db.registerModel(UserMetaModel)
export const Product = db.registerModel(ProductModel)
export const Category = db.registerModel(CategoryModel)
export const User = db.registerModel<UserData>(UserModel)