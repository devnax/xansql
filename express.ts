import xansql from "./src"
import UserModel from "./models/User"
import UserMetaModel from "./models/UserMeta"

export const mysql = new xansql({
   dialect: 'mysql',
   host: 'localhost',
})

export const sqlite = new xansql({
   dialect: 'sqlite',
   host: 'localhost',
})

const MysqlUser = mysql.registerModel(UserModel)
const MysqlUserMeta = mysql.registerModel(UserMetaModel)

MysqlUserMeta.find({
   where: {
      meta_key: {
         not: 'name',
         in: ['name', 'age'],
      },
      meta_value: '',
      user: {
         id: 1,
         name: 'John',
      }
   },
})

const server = (app) => {

   app.get('/', (req, res) => {
      res.send('Hello World!');
   });
   app.get('/hello', (req, res) => {
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