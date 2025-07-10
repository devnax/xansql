import xansql from "../src"
import UserModel from "./models/User"
import UserMetaModel from "./models/UserMeta"
import ProductModel from "./models/Product"
import CategoryModel from "./models/Category"
import dotenv from 'dotenv'

if (typeof process !== 'undefined' && process?.env) {
   try {
      dotenv.config()
   } catch (e) {
      console.warn('dotenv failed to load:', e);
   }
}

const conn = typeof process !== 'undefined' ? process.env.MYSQL_DB : 'http://localhost:3000/data';

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
   dialect: "mysql",
   cache: [
      {

      }
   ]
})
export const UserMeta = db.model(UserMetaModel)
export const Product = db.model(ProductModel)
export const Category = db.model(CategoryModel)
export const User = db.model(UserModel)