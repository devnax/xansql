import xansql from "./src"
import UserModel from "./models/User"
import UserMetaModel from "./models/UserMeta"

export const mysql = new xansql("mysql://root:root@127.0.0.1:3306/xansql")
export const sqlite = new xansql("sqlite://./db.sqlite")

const MysqlUser = mysql.registerModel(UserModel)
const MysqlUserMeta = mysql.registerModel(UserMetaModel)


const SqliteUser = sqlite.registerModel(UserModel)

const server = async (app) => {

   const sql = `
   CREATE TABLE users (
id INTEGER   PRIMARY KEY AUTOINCREMENT,
username TEXT  ,
email TEXT ,
password TEXT,
created_at TEXT  DEFAULT CURRENT_TIMESTAMP,
updated_at TEXT  DEFAULT CURRENT_TIMESTAMP
);
   `
   const res = await sqlite.excute("SELECT * FROM users");
   console.log(res);

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