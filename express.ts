import xansql from "./src"
import UserModel from "./example/models/User"
import UserMetaModel from "./example/models/UserMeta"
import ProductModel from "./example/models/Product"
import CategoryModel from "./example/models/Category"

export const db = new xansql("mysql://root:root@127.0.0.1:3306/xansql")
const UserMeta = db.model(UserMetaModel)
const Product = db.model(ProductModel)
const Category = db.model(CategoryModel)
const User = db.model(UserModel)

// db.migrate(true)


// // db.migrate()

// User.find({
//    orderBy: {
//       id: "desc",
//       metas: {
//          key: "asc",
//          value: "desc",
//       }
//    },
//    limit: {
//       metas: {
//          take: 20,
//          page: 2
//       }
//    },
//    select: {
//       name: true,
//       email: true,
//       metas: {
//          id: true,
//          // user: {
//          //    id: true,
//          //    name: true,
//          // }
//       },
//       // products: {
//       //    id: true,
//       //    name: true,
//       //    user: {
//       //       id: true,
//       //       name: true,
//       //       username: true
//       //    },
//       // }
//    },
//    where: {
//       email: {
//          equals: "asd",
//          gte: "123",
//          lte: "1234",
//       },
//       username: {
//          contains: "nax",
//       },
//       metas: {
//          key: "hello",
//          user_id: 3,
//          value: {
//             in: ["hello", "world"]
//          }
//       }
//       // products: {
//       //    name: "hello",
//       //    user: {
//       //       username: "nax",
//       //       password: "1234",
//       //    },
//       //    categories: {
//       //       name: "mobile",
//       //    }
//       // }
//    }
// })

// User.create({
//    data: {
//       name: "hello",
//       email: "nax@gmail.com",
//       password: "1234",
//       metas: [
//          {
//             meta_key: "hello",
//             meta_value: "world",
//          },
//          {
//             meta_key: "hello2",
//             meta_value: "world2",
//          }
//       ]
//    },
//    select: "partial"
// })



// User.update({
//    data: {
//       name: "change",
//       email: "change@gmail.com",
//       password: "1234",
//       metas: {
//          meta_value: "nice",
//       }
//    },
//    where: {
//       id: 1,
//       metas: {
//          meta_key: "hello1",
//       }
//    },
//    select: "partial"
// })

User.delete({
   where: {
      email: "nax@gmail.com"
   }

})


const server = async (app) => {

   app.get('/hello', async (req, res) => {
      res.send('Hello Express!');
   });
   app.get('/user/:name', (req, res) => {
      res.send(`Hello ${req.params.name}`);
   });
   app.get('/user/:name/:age', (req, res) => {
      res.send(`Hello ${req.params.name}, ${req.params.age}`);
   });
}
export default server;