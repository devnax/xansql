import { Xansql } from '../src'
import { XansqlBridgeDialect } from '@xansql/bridge';
// import { ProductCategorySchema, ProductMetaSchema, ProductModelSchema, UserModelMetaSchema, UserModelSchema } from './Schema';

export const db = new Xansql({
   // debug: true,
   dialect: XansqlBridgeDialect("http://localhost:4000/data") as any,
})

// export const UserModel = db.model("users", UserModelSchema)
// export const ProductModel = db.model("products", ProductModelSchema)
// export const ProductCategory = db.model("categories", ProductCategorySchema)
// export const UserModelMeta = db.model("user_metas", UserModelMetaSchema)
// export const ProductMetaModel = db.model("metas", ProductMetaSchema)
