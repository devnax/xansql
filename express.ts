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
            // uid: 199,
            // user_posts: {
            //    pid: 375,
            // }
         },
         select: {
            name: true,
            email: true,
            user_posts: {
               orderBy: {
                  pid: "asc"
               },
               limit: {
                  take: 1,
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
            option: true,
            user_posts: {
               select: {
                  content: true,
                  title: true,
               }
            }
         },
         data: {
            name: "John Doe",
            email: `john${Math.floor(Math.random() * 10000)}@doe.com`,
            created_at: new Date(),
            option: {
               theme: "dark",
               notifications: false,
            },
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
      res.json(result)
   });

   app.get('/delete', async (req, res) => {

      const result = await UserModel.delete({
         select: {
            name: true,
            email: true,
            user_posts: {
               select: {
                  content: true,
                  title: true,
               }
            }
         },
         where: {
            uid: 197,
            user_posts: {
               pid: 391
            }
         }
      })
      res.json(result)
   });

   app.get('/update', async (req, res) => {

      const result = await UserModel.update({
         select: {
            name: true,
            email: true,
            user_posts: {
               select: {
                  content: true,
                  title: true,
               }
            }
         },
         where: {
            uid: 4,
         },
         data: {
            name: "John Updated",
            email: `john${Math.floor(Math.random() * 10000)}@doe.com`,
            user_posts: {
               data: {
                  title: `Updated Title ${Math.floor(Math.random() * 10000)}`,
                  content: "Updated Content",
               },
               where: {
                  // pid: 5
               }
            }
         }
      })
      res.json(result)
   });

   app.get('/migrate', async (req, res) => {
      await db.migrate(true)
      res.send(`Migrated`);
   });

}
export default server;