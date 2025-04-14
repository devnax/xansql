import xansql from "./src"
import UserModel from "./example/models/User"
import UserMetaModel from "./example/models/UserMeta"

export const db = new xansql("mysql://root:root1234@127.0.0.1:3306/xansql")

const User = db.model(UserModel)
const UserMeta = db.model(UserMetaModel)

// // db.migrate()
User.find({
   limit: {
      take: 10,
      skip: 0,
      metas: {
         take: 10,
         skip: 0,
      }
   },
   select: {
      id: true,
      name: true,
      metas: {
         id: true,
         key: true,
         value: true,
      }
   },
   orderBy: {
      id: "desc",
      metas: {
         key: "asc",
         value: "desc",
      }
   },
   where: {
      name: "hello",
      metas: {
         key: "hello",
         value: "hello",
      }
   }
})
// UserMeta.find({
//    where: {
//       key: "hello",
//       user: {
//          name: "hello",
//       },
//       customer: {

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