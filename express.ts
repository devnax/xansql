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
export const db = new xansql(mysql)
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
            take: 10,
         },
         select: {
            id: true,
            name: true,
            email: true,
            metas: {
               meta_key: true,
               meta_value: true,
            },
            products: {
               id: true,
               name: true,
               categories: {
                  id: true,
                  name: true
               }
            }
         },
         where: {
            id: {
               in: [1, 2, 3, 4, 5]
            }
         }
      })

      res.json(users);
   });
   app.get('/count', async (req, res) => {
      const users = await User.find({
         where: {
            id: 1
         },
         select: {
            metas: true,
            products: {
               categories: true
            }
         }
      })
      const usersCount = await User.count({
         where: {
            id: 1
         },
         select: {
            metas: true,
            products: {
               categories: true
            }
         }
      })
      res.json({ usersCount, users });
   });
   app.get('/faker', async (req, res) => {
      const users = fakeData(1000)
      const d = await User.create({
         data: {
            name: "John Doe",
            email: "example@gmail.com",
            password: "123456",
            metas: [
               {
                  meta_key: "test",
                  meta_value: "test"
               }
            ],
            products: [
               {
                  name: "Product 1",
                  price: 100,
                  categories: [
                     {
                        name: "Category 1",
                        description: "Category 1 description"
                     }
                  ]
               }
            ]
         }
      })
      res.send(d);
   });
   app.get('/delete', async (req, res) => {
      const del = await User.delete({
         where: {
            id: 2
         }
      })
      res.send(del);
   });
   app.get('/migrate', async (req, res) => {
      await db.migrate(true)
      res.send(`Migrated`);
   });

}
export default server;