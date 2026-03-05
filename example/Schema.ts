import { Model, xt } from "../src"

export class UserModel extends Model {
   schema() {
      return {
         uid: xt.id(),
         name: xt.string(),
         age: xt.number(),
         photo: xt.photo().nullable(),
         email: xt.string().email().unique().nullable(),
         phone: xt.number().nullable(),
         create_at: xt.date().createdAt(),
         update_at: xt.date().updatedAt(),
         products: xt.many(ProductModel, 'user'),
         customer: xt.one(UserModel, 'customers').nullable(),
         customers: xt.many(UserModel, 'customer'),
         metas: xt.many(UserMetaModel, 'user'),
      }
   }
}

export class UserMetaModel extends Model {
   schema() {
      return {
         id: xt.id(),
         key: xt.string(),
         value: xt.string(),
         user: xt.one(UserModel, "metas")
      }
   }
}

export class ProductModel extends Model {
   schema() {
      return {
         pid: xt.id(),
         name: xt.string(),
         description: xt.string(),
         status: xt.string(),
         user: xt.one(UserModel, 'products'),
         metas: xt.many(ProductMetaModel, 'product'),
         categories: xt.many(ProductCategoryModel, 'product'),
      }
   }
}

export class ProductMetaModel extends Model {
   schema() {
      return {
         id: xt.id(),
         key: xt.string(),
         value: xt.string(),
         product: xt.one(ProductModel, "metas")
      }
   }
}

export class ProductCategoryModel extends Model {
   schema() {
      return {
         id: xt.id(),
         name: xt.string(),
         value: xt.string(),
         product: xt.one(ProductModel, "categories"),
         sub_categories: xt.many(ProductSubCategoryModel, "category")
      }
   }
}

export class ProductSubCategoryModel extends Model {
   schema() {
      return {
         id: xt.id(),
         name: xt.string(),
         value: xt.string(),
         category: xt.one(ProductCategoryModel, "sub_categories"),
         group: xt.one(ProductSubCategoryGroupModel, "sub_categories").nullable(),
      }
   }
}

export class ProductSubCategoryGroupModel extends Model {
   schema() {
      return {
         id: xt.id(),
         name: xt.string(),
         value: xt.string(),
         sub_categories: xt.many(ProductSubCategoryModel, "group")
      }
   }
}
