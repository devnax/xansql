import { xt } from "../src";
import Schema from "../src/model/Schema";

export const ProductCategorySchema = new Schema("categories", {
   pcid: xt.id(),
   name: xt.string().index(),
   description: xt.string().optional(),
   post: xt.schema('products', "categories"),
})

export const UserModelMetaSchema = new Schema("user_metas", {
   uoid: xt.id(),
   meta_key: xt.string(),
   meta_value: xt.string(),
})

export const UserModelSchema = new Schema("users", {
   uid: xt.id(),
   name: xt.string(),
   username: xt.username().optional(),
   photo: xt.photo().optional(),
   email: xt.email(),
   password: xt.password(),
   metas: xt.array(xt.schema("user_metas", "user")),
   created_at: xt.createdAt(),
   updated_at: xt.updatedAt(),
})

export const ProductModelSchema = new Schema("products", {
   pid: xt.id(),
   name: xt.string().index(),
   description: xt.string(),
   price: xt.string(),
   disoucnt_price: xt.string().default(() => "100"),
   categories: xt.array(xt.schema("categories", "post")),
   user: xt.schema("users", "products").optional(),
})

export const ProductMetaSchema = new Schema("product_metas", {
   pmid: xt.id(),
   product: xt.schema("products", "metas"),
   meta_key: xt.string(),
   meta_value: xt.string(),
})

