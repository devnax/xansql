import dotenv from 'dotenv'
dotenv.config()
import fakeData from './faker'
import express, { Express } from 'express';
import { db, ProductModel, UserModel } from './example/DBServer'
import WhereArgsQuery from './src/model/Args/WhereArgs';
import SelectArgs from './src/model/Executer/Find/SelectArgs';
import UpdateDataArgs from './src/model/Executer/Update/UpdateDataArgs';
import XansqlBridgeServer from './src/dialect/XansqlBridge/XansqlBridgeServer';
import { XansqlFileMeta } from './src';
import fs from 'fs'
import path from 'path'

let dir = 'uploads';

const bridge = new XansqlBridgeServer(db, {
   basepath: "/data",
   mode: "development",
   file: {
      upload: async (chunk: Uint8Array, filemeta: XansqlFileMeta) => {
         const uploadDir = path.join(process.cwd(), dir);
         if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
         const filePath = path.join(uploadDir, filemeta.fileId);
         fs.appendFileSync(filePath, Buffer.from(chunk));
      },
      delete: async (fileId: string) => {
         const fs = await import('fs');
         const path = await import('path');
         const filePath = path.join(process.cwd(), dir, fileId);
         if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
         }
      }
   },
   isAuthorized: async (info) => {
      return true;
   }
})

const server = async (app: Express) => {
   app.use('/static', express.static('public'));
   app.use(express.json());
   app.use(express.urlencoded({ extended: true }));
   app.disable('etag');

   app.use('/data/*', express.raw({ type: bridge.XANFETCH_CONTENT_TYPE, limit: "10mb" }), async (req: any, res: any) => {
      const response = await bridge.listen(req.originalUrl, {
         body: req.body,
         headers: req.headers
      })
      res.status(response.status).end(response.value);
   })


   app.get('/select', async (req: any, res: any) => {
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

   app.get('/where', async (req: any, res: any) => {
      const where = new WhereArgsQuery(UserModel, {
         name: "John Doe",
         metas: {
            meta_key: "role",
         }
      })

      res.json(where.sql)
   });

   // app.get('/foreign', async (req:any, res:any) => {
   //    const f = db.foreignInfo("posts", "user")
   //    const u = db.foreignInfo("users", "user_posts")

   //    res.json({
   //       f, u
   //    })
   // });


   app.get('/find', async (req: any, res: any) => {
      const start = Date.now()

      const result = await UserModel.find({
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
         limit: {
            // take: 1000,
         },
         where: {
         },
         select: {
            name: true,
            photo: true,
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

   app.get("/aggregate", async (req: any, res: any) => {
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
   app.get("/count", async (req: any, res: any) => {
      const result = await ProductModel.avg('price', {

      })
      res.json(result)
   })

   app.get('/create', async (req: any, res: any) => {
      let longText = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.".repeat(1000); // ~5MB
      const file = new File([longText], 'hello.txt', { type: 'text/plain' });

      try {
         const result = await UserModel.create({
            select: {
               name: true,
               email: true,
               photo: true,
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
               names: "John Doe",
               email: `john${Math.floor(Math.random() * 10000)}@doe.com`,
               password: "password",
               // photo: file,
               // created_at: new Date(),
               products: {
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
            }
         })

         console.log(result);

         res.json(result)

      } catch (error: any) {
         res.json({ error: error.message })
      }

      // const result = await ProductModel.create({
      //    // select: {
      //    //    description: true,
      //    //    name: true,
      //    //    user: true,
      //    //    categories: {
      //    //       select: {
      //    //          name: true,
      //    //       },
      //    //    }
      //    // },
      //    data: {
      //       user: 1,
      //       name: "Hello World",
      //       description: "This is my first post",
      //       price: "19.99",
      //       // user: 3,
      //       categories: [
      //          {
      //             name: "Tech",
      //          },
      //          { name: "News" },
      //       ],
      //    }
      // })
   });

   app.get('/delete', async (req: any, res: any) => {

      const result = await UserModel.delete({
         where: [
            {
               uid: 157,
            },
         ],
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

   app.get('/update-data-args', async (req: any, res: any) => {

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

   app.get('/update', async (req: any, res: any) => {
      let longText = "Lorem ipsum dolor sit amet".repeat(1000); // ~5MB
      const file = new File([longText], 'hello.txt', { type: 'text/plain' });

      const result = await UserModel.update({
         aggregate: {
            products: {
               price: {
                  sum: {
                     alias: "total_price"
                  },
               }
            }
         },
         // select: {
         //    name: true,
         //    email: true,
         //    products: {
         //       orderBy: {
         //          pid: "desc"
         //       },
         //       select: {
         //          pid: true,
         //          name: true,
         //          description: true,
         //          price: true,
         //       }
         //    }
         // },
         where: {
            uid: 1,
         },
         data: {
            name: "John Updated",
            email: `john${Math.floor(Math.random() * 10000)}@doe.com`,
            // photo: file,
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

   app.get('/models', async (req: any, res: any) => {
      db.models
      res.send(`Migrated`);
   });

   app.get('/migrate', async (req: any, res: any) => {
      const status = await db.migrate(true)
      res.json({ status });
   });

   app.get('/faker', async (req: any, res: any) => {
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
      res.json(users)
   });

}
export default server;