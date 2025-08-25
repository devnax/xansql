import dotenv from 'dotenv'
dotenv.config()
import fakeData from './faker'
import express from 'express';
import { db, PostModel, UserModel } from './example'

const server = async (app) => {
   app.use('/static', express.static('public'));
   app.use(express.json());
   app.use(express.urlencoded({ extended: true }));
   app.disable('etag');
   // app.use('/data/*', async (req, res) => {
   //    const response = await db.handleClient({
   //       signeture: req.headers['x-signeture'],
   //       path: req.originalUrl,
   //       body: req.body,
   //       method: req.method as any,
   //    })

   //    res.status(response.status).end(response?.value);
   // });

   // app.get('/count', async (req, res) => {
   //    const users = await User.find({
   //       where: {
   //          id: 1
   //       },
   //       select: {
   //          metas: true,
   //          products: {
   //             categories: true
   //          }
   //       }
   //    })
   //    const usersCount = await User.count({
   //       where: {
   //          id: 1
   //       },
   //       select: {
   //          metas: true,
   //          products: {
   //             categories: true
   //          }
   //       }
   //    })
   //    res.json({ usersCount, users });
   // });
   // app.get('/faker', async (req, res) => {
   //    const users = fakeData(10000)
   //    const d = await User.create({ data: users })
   //    res.send(d);
   // });
   // app.get('/delete', async (req, res) => {
   //    const del = await User.delete({
   //       where: {
   //          id: 2
   //       }
   //    })
   //    res.send(del);
   // });

   app.get('/find', async (req, res) => {
      await UserModel.find({
         where: {
            // name: "John Doe",
         },
         select: {
            _all: true,
            posts: {
               select: {
                  id: true,
                  title: true,
                  content: true,
               }
            }
         },
      })

      res.send(`finded`);
   });

   app.get('/create', async (req, res) => {
      await PostModel.create({
         data: [
            {
               title: "Hello World",
               content: "This is my first post"
            },
            {
               title: "Hello World",
               content: "This is my first post",
            }
         ]
      })
      // await UserModel.create({
      //    data: {
      //       name: "John Doe",
      //       email: `john${Math.floor(Math.random() * 10000)}@doe.com`,
      //       created_at: new Date().toISOString(),
      //       posts: [
      //          {
      //             title: "Hello World",
      //             content: "This is my first post"
      //          },
      //          {
      //             title: "Hello World",
      //             content: "This is my first post",
      //          }
      //       ]
      //    }
      // })

      res.send(`created`);
   });

   app.get('/migrate', async (req, res) => {
      await db.migrate(true)
      res.send(`Migrated`);
   });

}
export default server;