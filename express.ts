import dotenv from 'dotenv'
dotenv.config()
import fakeData from './faker'
import express from 'express';
import { db, ProductModel, UserModel, UserModelMeta } from './example'
import WhereArgsQuery from './src/Schema/Args/WhereArgs';
import SelectArgs from './src/Schema/Executer/Find/SelectArgs';
import UpdateDataArgs from './src/Schema/Executer/Update/UpdateDataArgs';

const server = async (app) => {
   app.use('/static', express.static('public'));
   app.use(express.json());
   app.use(express.urlencoded({ extended: true }));
   app.disable('etag');

   app.use('/data/*', express.raw({ type: "application/octet-stream", limit: "10mb" }), async (req, res) => {
      const response = await db.listen({
         signeture: req.headers['x-signeture'],
         path: req.originalUrl,
         body: req.body,
         method: req.method,
         origin: req.headers['x-origin'],
      }, { name: "express" })
      res.status(response.status).end(response.content);
   })


   app.get('/select', async (req, res) => {
      let select;
      select = new SelectArgs(UserModel, {
         name: true,
         products: {

         }
      })

      // select = new SelectArgs(ProductModel, {
      //    name: true,
      //    user: {
      //       select: {
      //          username: true,
      //          metas: true,
      //       },
      //    },
      // })

      res.json({
         sql: select.sql,
         columns: select.columns,
         relations: select.relations
      })
   });

   app.get('/where', async (req, res) => {
      const where = new WhereArgsQuery(UserModel, {
         name: "John Doe",
         metas: {
            meta_key: "role",
         }
      })

      res.json(where.sql)
   });

   // app.get('/foreign', async (req, res) => {
   //    const f = db.foreignInfo("posts", "user")
   //    const u = db.foreignInfo("users", "user_posts")

   //    res.json({
   //       f, u
   //    })
   // });


   app.get('/find', async (req, res) => {
      const start = Date.now()

      const result = await UserModel.find({
         limit: {
            take: 20,
         },
         aggregate: {
            products: {
               price: {
                  sum: {
                     alias: "total_price"
                  },
                  avg: {
                     alias: "avg_price",
                     round: 2
                  },
               }
            },
            metas: {
               meta_value: {
                  count: true
               }
            }
         },
         select: {
            name: true,
            products: {
               aggregate: {
                  categories: {
                     pcid: {
                        count: true,
                     },
                     name: {
                        count: true,
                     }
                  }
               },
               select: {
                  categories: true
               }
            }
         }
      })

      // const result = await ProductModel.find({
      //    orderBy: {
      //       pid: "desc",
      //    },
      //    limit: {
      //       // take: 1,
      //    },
      //    select: {
      //       name: true,
      //       user: {
      //          select: {
      //             username: true,
      //             metas: {
      //                limit: {
      //                   take: 2,
      //                }
      //             },
      //          }
      //       }
      //    }
      // })

      const end = Date.now()
      console.log(`Find ${result.length} users in ${end - start}ms`)
      res.json(result)
   });

   app.get("/aggregate", async (req, res) => {
      const start = Date.now()
      const result = await ProductModel.aggregate({
         orderBy: {
            name: "asc",
         },
         // groupBy: ["user", "price"],
         where: {
            user: {
               in: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
            }
         },
         select: {
            pid: {
               sum: true
            },
            price: {
               sum: true,
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
      const end = Date.now()
      console.log(`Aggregate ${result.length} products in ${end - start}ms`)
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

      // const result = await UserModel.create({
      //    select: {
      //       name: true,
      //       email: true,
      //       products: {
      //          select: {
      //             description: true,
      //             name: true,
      //             categories: {
      //                select: {
      //                   name: true,
      //                },
      //             }
      //          }
      //       }
      //    },
      //    data: {
      //       name: "John Doe",
      //       email: `john${Math.floor(Math.random() * 10000)}@doe.com`,
      //       password: "password",
      //       // created_at: new Date(),
      //       products: {
      //          name: "Hello World",
      //          description: "This is my first post",
      //          price: "19.99",
      //          // user: 3,
      //          categories: [
      //             {
      //                name: "Tech",
      //             },
      //             { name: "News" },
      //          ],
      //       }
      //    }
      // })

      const result = await ProductModel.create({
         select: {
            description: true,
            name: true,
            user: true,
            categories: {
               select: {
                  name: true,
               },
            }
         },
         data: {
            user: 1,
            name: "Hello World",
            description: "This is my first post",
            price: "19.99",
            // user: 3,
            categories: [
               {
                  name: "Tech",
               },
               { name: "News" },
            ],
         }
      })
      res.json(result)
   });

   app.get('/delete', async (req, res) => {

      const result = await UserModel.delete({
         where: {
            uid: 161,
         },
         select: {
            name: true,
            email: true,
            products: {
               select: {
                  pid: true,
                  name: true,
               }
            }
         }
      })
      // const result = await PostModel.delete({
      //    where: {
      //       pid: 1,
      //    }
      // })
      res.json(result)
   });

   app.get('/update-data-args', async (req, res) => {

      const result: any = new UpdateDataArgs(UserModel, {
         name: "John Updated",
         email: `john${Math.floor(Math.random() * 10000)}@doe.com`,
         products: {
            upsert: {
               where: {
                  pid: 3
               },
               create: {
                  user: 1,
                  name: `New Post ${Math.floor(Math.random() * 10000)}`,
                  description: "This is a new post",
                  price: "9999",
               },
               update: {
                  name: `Updated Post ${Math.floor(Math.random() * 10000)}`,
                  description: "This is an updated post",
                  price: "8888",
               }
            },

            // update: {
            //    where: { pid: 3 },
            //    data: {
            //       name: `Updated Title ${Math.floor(Math.random() * 10000)}`,
            //       description: "Updated Content",
            //    }
            // },
            // delete: {
            //    where: {
            //       pid: 5
            //    }
            // },
         }
      })
      res.json({
         sql: result.sql,
         relations: result.relations
      })
   });

   app.get('/update', async (req, res) => {

      const result = await UserModel.update({
         select: {
            name: true,
            email: true,
            products: {
               orderBy: {
                  pid: "desc"
               },
               select: {
                  pid: true,
                  name: true,
                  description: true,
                  price: true,
               }
            }
         },
         where: {
            uid: 4,
         },
         data: {
            name: "John Updated",
            email: `john${Math.floor(Math.random() * 10000)}@doe.com`,
            products: {
               // upsert: {
               //    where: {
               //       pid: 30
               //    },
               //    update: {
               //       name: `New Post ${Math.floor(Math.random() * 10000)}`,
               //       description: "This is a new post",
               //       price: "9999",
               //    },
               //    create: {
               //       name: `Updated Post ${Math.floor(Math.random() * 10000)}`,
               //       description: "This is an updated post",
               //       price: "8888",
               //    }
               // },

               // update: {
               //    where: { pid: 31 },
               //    data: {
               //       name: `Updated Title ${Math.floor(Math.random() * 10000)}`,
               //       description: "Updated Content",
               //    }
               // },
               // delete: {
               //    where: {
               //       pid: 32
               //    }
               // },
               // upsert: {
               //    where: {
               //       pid: 6
               //    },

               // },
               create: {
                  data: {
                     name: `New Post ${Math.floor(Math.random() * 10000)}`,
                     description: "This is a new post",
                     price: "9999",
                  }
               },
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
      const d = await fakeData(100)
      const start = Date.now()
      const users = await UserModel.create({
         data: d,
         select: {
            username: true,
            metas: true,
            products: true,
         }
      })

      const end = Date.now()
      console.log(`Created ${users?.length} users in ${end - start}ms`)
      return users


      res.json(users)
   });

}
export default server;