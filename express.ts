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
import WhereArgs from './src/Schema/Result/WhereArgs';

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
      const where = new WhereArgs(UserModel, {
         name: "John Doe",
         user_posts: {
            pid: 375,
            metas: {
               likes: 10
            },
            categories: [
               { name: "Tech" },
               { name: "News" },
            ]
         }
      })

      res.json(where.sql)
   });

   app.get('/foreign', async (req, res) => {
      const f = db.foreignInfo("posts", "user")
      const u = db.foreignInfo("users", "user_posts")

      res.json({
         f, u
      })
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
            name: "John Doe",
            // uid: 199,
            // user_posts: {
            //    pid: 375,
            // }
         },
         select: {
            name: true,
            email: true,
            meta: {
               select: {
                  theme: true,
               }
            },
            user_posts: {
               orderBy: {
                  pid: "asc"
               },
               limit: {
                  take: 1,
               },
               select: {
                  // pid: true,
                  title: true,
                  content: true,
                  // user: true,
               }
            }
         },
      })

      res.json(result)
   });

   app.get('/create', async (req, res) => {

      const result = await UserModel.create({
         select: {
            name: true,
            email: true,
            user_posts: {
               select: {
                  content: true,
                  title: true,
                  metas: {
                     select: {
                        views: true,
                        likes: true,
                     },
                     limit: { take: 1 }

                  },
                  categories: {
                     select: {
                        name: true,
                     },
                  }
               }
            }
         },
         data: {
            name: "John Doe",
            email: `john${Math.floor(Math.random() * 10000)}@doe.com`,
            // created_at: new Date(),
            user_posts: [
               {
                  title: "Hello World",
                  content: "This is my first post",
                  categories: [
                     { name: "Tech" },
                     { name: "News" },
                  ],
                  metas: [
                     {
                        views: Math.floor(Math.random() * 1000),
                        likes: Math.floor(Math.random() * 100),
                     },
                     {
                        views: Math.floor(Math.random() * 1000),
                        likes: Math.floor(Math.random() * 100),
                     }
                  ]
               },
               {
                  title: "Hello World",
                  content: "This is my first post",
                  metas: [
                     {
                        views: Math.floor(Math.random() * 1000),
                        likes: Math.floor(Math.random() * 100),
                     },
                     {
                        views: Math.floor(Math.random() * 1000),
                        likes: Math.floor(Math.random() * 100),
                     }
                  ]
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
            uid: 1,
         }
      })
      // const result = await PostModel.delete({
      //    where: {
      //       pid: 1,
      //    }
      // })
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

                  metas: true,
                  categories: true,
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
                  metas: {
                     data: {
                        views: Math.floor(Math.random() * 1000),
                        likes: Math.floor(Math.random() * 100),
                     },
                  }
               },
               where: {
                  // pid: 5
               }
            }
         }
      })
      res.json(result)
   });

   app.get('/models', async (req, res) => {
      db.models
      res.send(`Migrated`);
   });

   app.get('/migrate', async (req, res) => {
      await db.migrate(true)
      res.send(`Migrated`);
   });

}
export default server;