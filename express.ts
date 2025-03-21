import xansql from "./src"
import UserMetaModel from "./models/User"

export const mysql = new xansql({
   dialect: 'mysql',
   host: 'localhost',
})

export const sqlite = new xansql({
   dialect: 'sqlite',
   host: 'localhost',
})

const MysqlUserMeta = mysql.assignModel(UserMetaModel)
const SqliteUserMeta = sqlite.assignModel(UserMetaModel)

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