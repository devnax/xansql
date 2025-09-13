import dotenv from 'dotenv'
import { Xansql, Schema, xt } from '../src'
import Mysqldialect from '../src/Dialects/Mysql';
import SqliteDialect from '../src/Dialects/Sqlite';

if (typeof process !== 'undefined' && process?.env) {
   try {
      dotenv.config()
   } catch (e) {
      console.warn('dotenv failed to load:', e);
   }
}

// const UserOptionSchema = new Schema("metas", {
//    uoid: xt.id(),
//    theme: xt.string().default('light'),
//    notifications: xt.boolean().default(true),
// });

const UserSchema = new Schema("users", {
   uid: xt.id(),
   name: xt.string().index(),
   email: xt.string().index().unique(),
   age: xt.number().optional().nullable(),
   // meta: xt.hasOne('metas', 'user').optional(),

   created_at: xt.createdAt(),
   updated_at: xt.updatedAt(),

   user_posts: xt.array(xt.schema("posts", "user")),
});

const PostMetaSchema = new Schema("post_metas", {
   pmid: xt.id(),
   views: xt.number().default(0),
   likes: xt.number().default(0),
   post: xt.schema('posts', "metas"),
});

const PostCategorySectionSchema = new Schema("post_category_section", {
   pcgid: xt.id(),
   name: xt.string().index(),
   categories: xt.array(xt.schema("post_categories", "section")),
});

const PostCategorySchema = new Schema("post_categories", {
   pcid: xt.id(),
   name: xt.string().index(),
   post: xt.schema('posts', "categories"),
});

const PostSchema = new Schema("posts", {
   pid: xt.id(),
   title: xt.string().index(),
   content: xt.string(),
   // user: xt.schema('users', "user_posts"),
   metas: xt.array(xt.schema("post_metas", "post")),
   // categories: xt.array(xt.schema("post_categories", "post")),
});

const mysqlConn: string = (typeof process !== 'undefined' ? process.env.MYSQL_DB : 'mysql://root:password@localhost:3306/xansql') as string
const sqliteConn: string = 'db.sqlite'

const conn = {
   mysql: {
      connection: mysqlConn,
      dialect: Mysqldialect
   },
   sqlite: {
      connection: sqliteConn,
      dialect: SqliteDialect
   }
}

export const db = new Xansql(conn.sqlite)

// export const UserOptionModel = db.model(UserOptionSchema)
export const UserModel = db.model(UserSchema)
export const PostModel = db.model(PostSchema)
export const PostMeta = db.model(PostMetaSchema)
export const PostCategory = db.model(PostCategorySchema)
export const PostCategorySection = db.model(PostCategorySectionSchema)
