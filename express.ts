import xansql from "./src"
import UserModel from "./example/models/User"
import UserMetaModel from "./example/models/UserMeta"
import ProductModel from "./example/models/Product"
import CategoryModel from "./example/models/Category"

export const db = new xansql("mysql://root:root1234@127.0.0.1:3306/xansql")

const User = db.model(UserModel)
const UserMeta = db.model(UserMetaModel)
const Product = db.model(ProductModel)
const Category = db.model(CategoryModel)

// // db.migrate()

User.find({
   orderBy: {
      id: "desc",
      metas: {
         key: "asc",
         value: "desc",
      }
   },
   limit: {
      metas: {
         take: 20,
         page: 2
      }
   },
   select: {
      name: true,
      email: true,
      metas: {
         id: true,
         // user: {
         //    id: true,
         //    name: true,
         // }
      },
      // products: {
      //    id: true,
      //    name: true,
      //    user: {
      //       id: true,
      //       name: true,
      //       username: true
      //    },
      // }
   },
   where: {
      email: {
         equals: "asd",
         gte: "123",
         lte: "1234",
      },
      username: {
         contains: "nax",
      },
      metas: {
         key: "hello",
         user_id: 3,
         value: {
            in: ["hello", "world"]
         }
      }
      // products: {
      //    name: "hello",
      //    user: {
      //       username: "nax",
      //       password: "1234",
      //    },
      //    categories: {
      //       name: "mobile",
      //    }
      // }
   }
})

// Product.find({
//    limit: {
//       user: {
//          take: 20,
//       }
//    },
//    select: {
//       name: true,
//       user: {
//          id: true,
//          name: true,
//       }
//    },
//    where: {
//       name: "hello",
//    }
// })
// User.find({
//    limit: {
//       take: 10,
//       skip: 0,
//       metas: {
//          take: 10,
//          skip: 0,
//       }
//    },
//    select: {
//       id: true,
//       name: true,
//       metas: {
//          id: true,
//          key: true,
//          value: true,
//       },
//       products: {
//          id: true,
//          name: true,
//          user: true,
//          categorys: {
//             id: true,
//             name: true,
//          }
//       }
//    },
//    orderBy: {
//       id: "desc",
//       metas: {
//          key: "asc",
//          value: "desc",
//       }
//    },
//    where: {
//       name: "hello",
//       metas: {
//          key: "hello",
//          value: "hello",
//       },
//       products: {
//          name: "hello",
//       }
//    }
// })

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