import dotenv from 'dotenv'
import { Xansql, Model, xt } from '../src'
import SqliteDialect from '../src/libs/SqliteDialect'
import MysqlDialect from '../src/libs/MysqlDialect'
import FileInDirectory from '../src/libs/FileInDirectory';
import sha256 from '../src/utils/sha256';
if (typeof process !== 'undefined' && process?.env) {
   try {
      dotenv.config()
   } catch (e) {
      console.warn('dotenv failed to load:', e);
   }
}


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


// const UserMetaSchema = new Model("user_metas", {
//    uoid: xt.id(),
//    meta_key: xt.string(),
//    meta_value: xt.string(),
// });

// const UserSchema = new Model("users", {
//    uid: xt.id(),
//    name: xt.string(),
//    username: xt.string().optional().index(),
//    photo: xt.file().optional(),
//    email: xt.string().index(),
//    password: xt.string(),
//    metas: xt.array(xt.schema("user_metas", "user")),
//    created_at: xt.date().create(),
//    updated_at: xt.date().update(),
// });

// const ProductCategorySchema = new Model("categories", {
//    pcid: xt.id(),
//    name: xt.string().index(),
//    description: xt.string().optional(),
//    post: xt.schema('products', "categories"),
// });

// const ProductSchema = new Model("products", {
//    pid: xt.id(),
//    name: xt.string().index(),
//    description: xt.string(),
//    price: xt.string(),
//    categories: xt.array(xt.schema("categories", "post")),
//    user: xt.schema("users", "products").optional(),
// });




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
}, {
   hooks: {
      beforeCreate: async (args) => {
         return args;
      },
      afterCreate: async (data, args) => {
      }
   }
})
export const ProductModel = db.model("products", {
   pid: xt.id(),
   name: xt.string().index(),
   description: xt.string(),
   price: xt.string(),
   categories: xt.array(xt.schema("categories", "post")),
   user: xt.schema("users", "products").optional(),
})



db.on("BEFORE_CREATE", async ({ model, args }) => {
});
