import { Model, Xansql, xt } from "../src";
import { ProductMetaModel, ProductModel, UserMetaModel, UserModel } from "./Schema";
import XansqlBridgeDialect from '../src/dialects/Bridge/dialect'
const bridge = XansqlBridgeDialect("http://localhost:1234/data")

export const db = new Xansql({
   dialect: bridge.dialect,
   file: bridge.file
})

export const User = db.model(UserModel)
export const UserMeta = db.model(UserMetaModel)
export const Product = db.model(ProductModel)
export const ProductMeta = db.model(ProductMetaModel)