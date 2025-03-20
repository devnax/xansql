import xansql from "./src"
import { generateSQLQuery, bigInteger, string, integer, increments } from './src/sqltypes'

const db = new xansql({
   dialect: 'sqlite',
   host: 'localhost',
})


class User extends db.Model('users') {
   schema() {
      return {

      }
   }
}

// User.sync(true)

const generate = generateSQLQuery("users", {
   id: increments().primary(),
   amount: bigInteger(),
   name: string().notNull(),
   age: integer().notNull(),
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