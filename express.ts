import xansql from "./src"
import UserModel from "./example/models/User"
import UserMetaModel from "./example/models/UserMeta"
import ProductModel from "./example/models/Product"
import CategoryModel from "./example/models/Category"
import fakeData from './faker'

let mysql: any = "mysql://root:root@127.0.0.1:3306/xansql"
let sqlite: any = {
   dialect: 'sqlite',
   connection: 'db.sqlite'
}
export const db = new xansql(sqlite)
const UserMeta = db.model(UserMetaModel)
const Product = db.model(ProductModel)
const Category = db.model(CategoryModel)
const User = db.model(UserModel)

const server = async (app) => {
   app.get('/data', async (req, res) => {
      const users = await User.find({
         orderBy: {
            // id: "desc",
         },
         limit: {

         },
         select: {
            name: true,
            email: true,
            metas: {
               meta_key: true,
               meta_value: true,
               user: true
            },
            products: {
               name: true,
               price: true,
               user: {
                  name: true,
                  email: true,
                  metas: {
                     meta_key: true,
                     meta_value: true,
                  }
               },
               categories: {
                  name: true,
                  description: true,
               }
            }
         },
         where: {
            name: "adm'in"
         }
      })
      res.json(users);
   });
   app.get('/count', async (req, res) => {
      const users = await User.count({
         where: {
            id: {
               in: [1, 2, 3, 4, 5]
            }
         },
         select: {
            metas: true,
            products: {
               categories: true
            }
         }
      })
      res.json(users);
   });
   app.get('/faker', async (req, res) => {
      const users = fakeData(1000)
      await User.create({
         data: users
      })
      res.send(`done`);
   });
   app.get('/migrate', async (req, res) => {
      await db.migrate(true)
      res.send(`Migrated`);
   });

}
export default server;