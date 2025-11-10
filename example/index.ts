import dotenv from 'dotenv'
import { Xansql, Schema, xt } from '../src'
import SqliteDialect from '../src/dialects/Sqlite'
import MysqlDialect from '../src/dialects/Mysql'

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

const uploads = new Map<string, Uint8Array[]>()

export const db = new Xansql({
   dialect: SqliteDialect(sqliteConn),
   fetch: "http://localhost:4000/data",
   file: {
      upload: async (chunk: Uint8Array, chunkIndex: number, filemeta) => {

         if (!uploads.has(filemeta.name)) {
            uploads.set(filemeta.name, [])
         }
         const chunks = uploads.get(filemeta.name) as Uint8Array[]
         chunks[chunkIndex] = chunk
         uploads.set(filemeta.name, chunks)

         if (filemeta.isComplete) {
            const allChunks = uploads.get(filemeta.name) as Uint8Array[]
            const fileData = new Uint8Array(allChunks.reduce((acc, curr) => acc + curr.length, 0))
            let offset = 0
            for (let c of allChunks) {
               fileData.set(c, offset)
               offset += c.length
            }
            // Here you can save the fileData to disk or cloud storage
            console.log(`File ${filemeta.name} uploaded with size ${fileData.length} bytes`)
            uploads.delete(filemeta.name)

            const fs = await import('fs');
            const path = await import('path');
            const fileBuffer = Buffer.from(fileData);

            const uploadDir = path.join(process.cwd(), 'uploads');
            if (!fs.existsSync(uploadDir)) {
               fs.mkdirSync(uploadDir);
            }
            const filePath = path.join(uploadDir, `${filemeta.name}`);
            fs.writeFileSync(filePath, fileBuffer);

         }
      },
      delete: async (filename: string) => {
         // Custom file delete logic for server side
         return true
      }
   },
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

