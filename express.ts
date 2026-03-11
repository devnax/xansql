import dotenv from 'dotenv'
dotenv.config()
import express, { Express } from 'express';
import XansqlBridgeServer from './src/dialects/Bridge/server'
import { db, Product, User } from './example/db';

const bridge = new XansqlBridgeServer(db as any, {
   basepath: "/data",
   mode: "development",
   // debug: true,
   isAuthorized: async (info) => {
      return true;
   }
})

const server = async (app: Express) => {
   app.use('/static', express.static('public'));
   app.use(express.json());
   app.use(express.urlencoded({ extended: true }));
   app.disable('etag');

   app.use('/data/*', express.raw({ type: bridge.REQUEST_CONTENT_TYPE, limit: "10mb" }), async (req: any, res: any) => {
      const response = await bridge.listen(req.originalUrl, {
         body: req.body,
         headers: req.headers
      })
      res.status(response.status).end(response.value);
   })


   // app.get('/foreign', async (req: any, res: any) => {
   //    const f = db.foreignInfo("posts", "user")
   //    const u = db.foreignInfo("users", "user_posts")

   //    res.json({
   //       f, u
   //    })
   // });

   app.get('/create', async (req: any, res: any) => {
      const start = Date.now()
      const results = await User.create({
         select: {
            name: true,
            products: {
               select: {
                  categories: {
                     select: {
                        sub_categories: true
                     }
                  }
               }
            }
         },
         data: {
            name: "nax",
            email: Math.random() + "@gmail.com",
            age: 1,
            // metas: {
            //    key: "um",
            //    value: "nicer",
            // },
            products: [{
               name: "new Pro",
               description: "we",
               status: "asd",
               metas: {
                  key: "asd",
                  value: "asd"
               },
               categories: [
                  {
                     name: "Mobile",
                     value: "mobile",
                  },
                  {
                     name: "Electronics",
                     value: "Electronics",
                     sub_categories: [
                        {
                           name: "sub",
                           value: "sub",
                        }
                     ]
                  }
               ]
            }]
         }
      })
      res.json({ results })
   });

   app.get('/find', async (req: any, res: any) => {
      const start = Date.now()
      const results = await User.find({
         aggregate: {
            products: {
               pid: {
                  count: true,
                  sum: true
               },
               name: {
                  count: {
                  }
               }
            }
         },
         where: {
            name: "well",
            OR: [
               {
                  name: {
                     contains: "as"
                  }
               },

            ],

         },
         orderBy: {
            // uid: "desc"
         },
         select: {
            // email: true,
            customer: {

            },
            products: {
               aggregate: {
                  categories: {
                     id: {
                        count: true
                     }
                  }
               },
               limit: {
                  take: 2,
               },
               select: {
                  name: true,
                  metas: {
                     select: {
                        key: true,
                     }
                  },
                  categories: {
                     // where: {
                     //    value: "Electronics"
                     // },
                     // limit: { take: 1 },
                     orderBy: {
                        id: "desc"
                     },
                     select: {
                        sub_categories: {
                           select: {
                              group: true
                           }
                        }
                     }
                  }
               }
            }
         }
      })

      res.json({ results })

   });
   app.get('/aggregate', async (req: any, res: any) => {
      const results = await User.aggregate({
         groupBy: ['email', "age"],
         limit: {
            take: 10
         },
         // orderBy: {
         //    email: "asc"
         // },
         select: {
            name: {
               count: true
            },
            uid: {
               count: true,
            },
            email: {
               count: true
            }
         }
      })

      res.json({ results })

   });

   app.get('/update', async (req: any, res: any) => {

      const results = await User.update({
         data: {
            name: "ssd",
            age: 20,
            products: {
               data: {
                  name: "Updated",
                  categories: {
                     data: {
                        name: "Telephone"
                     },
                     where: {
                        value: "mobile"
                     }
                  }
               }
            }
         },
         where: {
            uid: 2,
         }
      })

      res.json({ results })
   });

   app.get("/count", async (req: any, res: any) => {
      const results = await User.paginate({
         page: 1,
         where: {}
      })
   })

   app.get('/delete', async (req: any, res: any) => {
      const results = await User.delete({
         where: {
            uid: 1
         }
      })

      res.json({ results })

   });



   app.get('/models', async (req: any, res: any) => {

   });

   app.get('/migrate', async (req: any, res: any) => {
      const results = await db.migrate(true)
      res.json({ results })
   });

   app.get('/faker', async (req: any, res: any) => {
      // const d = await fakeData(100)
      // const start = Date.now()
      // const users = await UserModel.create({
      //    data: d,
      //    select: {
      //       username: true,
      //       metas: true,
      //       products: true,
      //    }
      // })

      // const end = Date.now()
      // console.log(`Created ${users?.length} users in ${end - start}ms`)
      // res.json(users)
   });

}
export default server;