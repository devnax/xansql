import dotenv from 'dotenv'
dotenv.config()
import fakeData from './faker'
import express from 'express';
import { db, ProductModel, UserModel } from './example'
import WhereArgsQuery from './src/Schema/Result/WhereArgsQuery';

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
      const where = new WhereArgsQuery(UserModel, {
         name: "John Doe",
         user_posts: {
            pid: 375,
            metas: {
               likes: 10
            },
            categories: {
               name: "Tech",
               section: {
                  name: "Technology"
               }
            }
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


   app.get('/find', async (req, res) => {
      const start = Date.now()

      const result = await UserModel.find({
         // distinct: ["email"],
         orderBy: {
            // uid: "desc",
            // email: "desc"
         },
         limit: {
            take: 10,
            skip: 0
         },
         where: {
            // uid: {
            //    in: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
            // },
            // user_posts: {
            //    pid: 375,
            // }
         },
         aggregate: {
            metas: {
               uoid: {
                  count: true
               }
            },
            products: {
               price: {
                  sum: {
                     alias: "total_price"
                  },
                  avg: {
                     alias: "avg_price"
                  }
               }
            }
         },
         select: {
            name: true,
            // email: true,
            metas: true,
            // products: {
            //    distinct: ["price"],
            //    orderBy: { price: "desc" },

            //    select: {
            //       name: true,
            //       price: true,
            //    },
            //    limit: { take: 3 }
            // }
         },
      })

      const end = Date.now()
      console.log(`Find ${result.length} users in ${end - start}ms`)
      res.json(result)
   });

   app.get("/aggregate", async (req, res) => {
      const result = await ProductModel.aggregate({
         orderBy: {
            // name: "asc",
         },
         // groupBy: ["user"],
         // where: {
         //    name: {
         //       contains: "Hello"
         //    }
         // },
         aggregate: {
            price: {
               sum: {
                  distinct: true,
                  orderBy: "asc",
               },
               avg: {
                  alias: "avg_price",
                  round: 2
               },
               min: {
                  alias: "min_price",
                  round: 0
               },
               max: true,
            }
         }
      })
      res.json(result)
   })
   app.get("/count", async (req, res) => {
      const result = await ProductModel.avg({
         column: "price",
         round: 2,
         where: {

         }
      })
      res.json(result)
   })

   app.get('/create', async (req, res) => {

      const result = await UserModel.create({
         select: {
            name: true,
            email: true,
            products: {
               select: {
                  description: true,
                  name: true,
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
            password: "password",
            // created_at: new Date(),
            products: [
               {
                  name: "Hello World",
                  description: "This is my first post",
                  price: "19.99",
                  categories: [
                     {
                        name: "Tech",
                     },
                     { name: "News" },
                  ],
               },
               {
                  name: "Hello World",
                  description: "This is my first post",
                  price: "29.99",
               }
            ]
         }
      })
      res.json(result)
   });

   app.get('/delete', async (req, res) => {

      const result = await UserModel.delete({
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

   app.get('/faker', async (req, res) => {
      const d = await fakeData(10000)
      // performance log

      const start = Date.now()
      const users = await UserModel.create({
         data: d,
         select: {
            username: true,
         }
      })
      const end = Date.now()
      console.log(`Created ${users.length} users in ${end - start}ms`)

      res.json(users)
   });

}
export default server;