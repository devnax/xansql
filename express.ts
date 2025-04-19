import xansql from "./src"
import UserModel from "./example/models/User"
import UserMetaModel from "./example/models/UserMeta"
import ProductModel from "./example/models/Product"
import CategoryModel from "./example/models/Category"
import fakeData from './faker'

export const db = new xansql("mysql://root:root@127.0.0.1:3306/xansql")
const UserMeta = db.model(UserMetaModel)
const Product = db.model(ProductModel)
const Category = db.model(CategoryModel)
const User = db.model(UserModel)

// db.migrate(true)

const loadFakeData = async () => {
   const users = fakeData(1000)
   await User.create({ data: users })
}


// loadFakeData()

const server = async (app) => {
   app.get('/data', async (req, res) => {
      const users = await User.find({
         orderBy: {
            id: "desc",
         },
         select: {
            name: true,
            email: true,
            metas: {
               meta_key: true,
               meta_value: true,
               user: true
            },
            // products: {
            //    name: true,
            //    price: true,
            //    user: true,
            //    categories: {
            //       name: true,
            //       description: true,
            //    }
            // }
         },
         where: {
            id: {
               in: [1]
            }
         }
      })
      res.json(users);
   });
   app.get('/user/:name', (req, res) => {
      res.send(`Hello ${req.params.name}`);
   });
   app.get('/user/:name/:age', (req, res) => {
      res.send(`Hello ${req.params.name}, ${req.params.age}`);
   });
}
export default server;