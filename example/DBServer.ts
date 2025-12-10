import dotenv from 'dotenv'
import { Xansql } from '../src'
import SqliteDialect from '../src/dialect/SqliteDialect'
import MysqlDialect from '../src/dialect/MysqlDialect'
import { ProductCategorySchema, ProductMetaSchema, ProductModelSchema, UserModelMetaSchema, UserModelSchema } from './Schema';

dotenv.config()

const mysqlConn: string = (typeof process !== 'undefined' ? process.env.MYSQL_DB : 'mysql://root:root1234@localhost:3306/xansql') as string
const sqliteConn: string = 'db.sqlite'

const mysql = MysqlDialect({
   host: "localhost",
   port: 3306,
   user: 'root',
   password: 'root1234',
   database: "xansql",
})

const sqlite = SqliteDialect(sqliteConn)
export const db = new Xansql({
   dialect: mysql,
})

export const UserModel = db.model(UserModelSchema)
export const ProductModel = db.model(ProductModelSchema)
export const ProductCategory = db.model(ProductCategorySchema)
export const UserModelMeta = db.model(UserModelMetaSchema)
export const ProductMetaModel = db.model(ProductMetaSchema)