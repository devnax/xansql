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

const UserSchema = new Schema("users", {
   id: xt.id(),
   name: xt.string().index(),
   email: xt.string().index().unique(),
   created_at: xt.date(),
});

const PostSchema = new Schema("posts", {
   id: xt.id(),
   title: xt.string().index(),
   content: xt.string(),
   user: xt.join('users', 'posts').optional(),
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

export const UserModel = db.model(UserSchema)
export const PostModel = db.model(PostSchema)
