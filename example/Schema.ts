import { Model, xt } from "../src"


export enum USER_ROLES {
   ADMIN = "admin",
   AGENT_MANAGER = "agent_manager",
   AGENT_HANDLER = "agent_handler",
   APPLICATION_MANAGER = "application_manager",
   APPLICATION_HANDLER = "application_handler",
   CONTENT_PUBLISHER = "content_publisher",
   ACCOUNT_MANAGER = "account_manager",

   AGENT = "agent",
   AGENT_COUNSELOR = "agent_counselor",
   AGENT_STUDENT = "agent_student",
   AGENT_APPLICATION_MANAGER = "agent_application_manager",
   AGENT_ACCOUNT_MANAGER = "agent_account_manager",
}

export class UserModel extends Model {
   schema() {
      return {
         uid: xt.id(),
         name: xt.string(),
         age: xt.number().default(20),
         photo: xt.photo().nullable(),
         email: xt.string().email().unique().nullable(),
         phone: xt.number().nullable(),
         role: xt.enum(USER_ROLES).default(USER_ROLES.ACCOUNT_MANAGER).nullable(),

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
