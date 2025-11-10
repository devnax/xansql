import dotenv from 'dotenv'
import { Xansql, Schema, xt } from '../src'
import SqliteDialect from '../src/dialects/Sqlite'
import MysqlDialect from '../src/dialects/Mysql'
import FileInDirectory from '../src/file/FileInDirectory';

if (typeof process !== 'undefined' && process?.env) {
   try {
      dotenv.config()
   } catch (e) {
      console.warn('dotenv failed to load:', e);
   }
}

const UserMetaSchema = new Schema("user_metas", {
   uoid: xt.id(),
   meta_key: xt.string(),
   meta_value: xt.string(),
});

const UserSchema = new Schema("users", {
   uid: xt.id(),
   name: xt.string(),
   username: xt.string().optional().index(),
   photo: xt.file().optional(),
   email: xt.string().index(),
   password: xt.string(),
   metas: xt.array(xt.schema("user_metas", "user")),
   created_at: xt.date().create(),
   updated_at: xt.date().update(),
});

const ProductCategorySchema = new Schema("categories", {
   pcid: xt.id(),
   name: xt.string().index(),
   description: xt.string().optional(),
   post: xt.schema('products', "categories"),
});

const ProductSchema = new Schema("products", {
   pid: xt.id(),
   name: xt.string().index(),
   description: xt.string(),
   price: xt.string(),
   categories: xt.array(xt.schema("categories", "post")),
   user: xt.schema("users", "products").optional(),
});

const mysqlConn: string = (typeof process !== 'undefined' ? process.env.MYSQL_DB : 'mysql://root:root1234@localhost:3306/xansql') as string
const sqliteConn: string = 'db.sqlite'

const uploadsInProgress = new Map<string, { fileHandle: any, receivedChunks: number }>();
export const db = new Xansql({
   dialect: SqliteDialect(sqliteConn),
   fetch: "http://localhost:4000/data",
   file: FileInDirectory({ dir: 'uploads' }),
   // maxLimit: {
   //    // create: 10000
   // },
   // cachePlugins: [
   //    // XansqlCache
   // ],
   // listenerConfig: {
   //    server: {
   //       mode: "development",
   //       basepath: '/data',
   //       clients: [
   //          {
   //             origin: "http://localhost:3000",
   //             secret: "clientsecretclientsecret"
   //          }
   //       ]
   //    },
   //    client: {
   //       url: "http://localhost:3000/data",
   //       secret: "clientsecretclientsecret",
   //    },
   // }
})
export const ProductCategory = db.model(ProductCategorySchema)

export const UserModelMeta = db.model(UserMetaSchema)

export const UserModel = db.model(UserSchema, {
   hooks: {
      beforeCreate: async (args) => {
         return args;
      },
      afterCreate: async (data, args) => {
      }
   }
})
export const ProductModel = db.model(ProductSchema)

