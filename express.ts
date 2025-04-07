import xansql from "./src"
import UserModel from "./example/models/User"
import UserMetaModel from "./example/models/UserMeta"

export const db = new xansql("mysql://root:root1234@127.0.0.1:3306/xansql")

const User = db.register(UserModel)
const UserMeta = db.register(UserMetaModel)

// // db.migrate()
// User.find({
//    where: {
//       name: "hello",
//       user_metas: {
//          select: ["id", "key"],
//          where: {
//             key: "well"
//          }
//       }
//    },
//    select: ["id", "name", 'age'],
// })

UserMeta.find({
   where: {
      value: "asd",
      key: {
         contains: "well"
      },
      user: {
         select: ["id", "name"],
         orderBy: {
            name: "asc",
         },
         where: {
            name: "hello",
            user_metas: {
               select: ["id", "key"],
               where: {
                  key: "well"
               }
            }
         }
      }
   },
   select: ["id", "name", 'age'],
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