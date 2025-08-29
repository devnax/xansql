import dotenv from 'dotenv'
dotenv.config()
import fakeData from './faker'
import express from 'express';
import { db, PostModel, UserModel } from './example'
import BuildWhere from './src/Schema/Query/BuildWhere';
import BuildSelect from './src/Schema/Query/BuildSelect';
import BuildOrderby from './src/Schema/Query/BuildOrderby';
import BuildLimit from './src/Schema/Query/BuildLimit';
import BuildData from './src/Schema/Query/BuildData';

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


   app.get('/where', async (req, res) => {
      const result = BuildWhere({
         name: "John Doe",
         user_posts: {
            title: "as",
            user: {
               email: "example",
               user_posts: [
                  {
                     title: {
                        contains: "x"
                     },

                     user: [
                        { name: "x" },
                        {
                           email: {
                              endsWith: "m"
                           }
                        }
                     ]
                  },
                  { content: "y" }
               ]
            }
         }
      }, UserModel)

      res.json(result)
   });

   app.get('/select', async (req, res) => {
      const result = BuildSelect({
         name: true,
         email: true,
         user_posts: {
            select: {
               pid: true,
               title: true,
               content: true,
               user: {
                  select: {
                     name: true,
                     user_posts: {
                        select: {
                           title: true,
                           user: {
                              select: {
                                 name: true,
                              }
                           }
                        }
                     }
                  }
               }
            }
         }
      }, UserModel)

      res.json(result)
   });

   app.get('/orderby', async (req, res) => {
      const result = BuildOrderby({
         name: "asc",
      }, UserModel)

      res.json(result)
   });
   app.get('/limit', async (req, res) => {
      const result = BuildLimit({
         take: 10,
         skip: 5,
      }, UserModel)

      res.json(result)
   });
   app.get('/data', async (req, res) => {
      const result = BuildData({
         name: "John Doe",
         email: `john${Math.floor(Math.random() * 10000)}@doe.com`,
         created_at: new Date(),
         user_posts: [
            {
               title: "Hello World",
               content: "This is my first post"
            },
            {
               title: "Hello World 2",
               content: "This is my second post",
            }
         ]
      }, UserModel)

      res.json(result)
   });
   app.get('/relation', async (req, res) => {
      const result = db.getRelations()

      res.json(result)
   });
   app.get('/foreigns', async (req, res) => {
      const result = db.foreigns

      res.json(result)
   });

   app.get('/find', async (req, res) => {
      const result = await UserModel.find({
         orderBy: {
            uid: "desc"
         },
         limit: {
            take: 500,
            skip: 0
         },
         where: {
         },
         select: {
            name: true,
            email: true,
            user_posts: {
               orderBy: {
                  // pid: "desc"
               },
               limit: {
               },
               select: {
                  pid: true,
                  title: true,
                  content: true,
               }
            }
         },
      })
      // const result = await PostModel.find({
      //    where: {},
      //    select: {
      //       title: true,
      //       user: {
      //          select: {
      //             name: true,
      //             user_posts: {
      //                select: {
      //                   title: true,
      //                   // user: true
      //                }
      //             }
      //          }
      //       }
      //    }
      // })
      res.json(result)
   });

   app.get('/create', async (req, res) => {

      const result = await UserModel.create({
         select: {
            name: true,
            email: true,
            user_posts: {
               select: {
                  // title: true,
                  content: true,
                  user: {
                     select: { name: true }
                  }
               }
            }
         },
         data: {
            name: "John Doe",
            email: `john${Math.floor(Math.random() * 10000)}@doe.com`,
            created_at: new Date(),
            user_posts: [
               {
                  title: "Hello World",
                  content: "This is my first post"
               },
               {
                  title: "Hello World",
                  content: "This is my first post",
               }
            ]
         }
      })

      console.log(result);

      res.json(result)
   });

   app.get('/migrate', async (req, res) => {
      await db.migrate(true)
      res.send(`Migrated`);
   });

}
export default server;