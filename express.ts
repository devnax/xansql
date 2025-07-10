import dotenv from 'dotenv'
dotenv.config()
import fakeData from './faker'
import { db, User } from './example';
import sqserver from './src/securequ/server';
import { SecurequServer } from 'securequ';
import express from 'express';


const server = async (app) => {
   app.use('/static', express.static('public'));
   app.use(express.json());
   app.use(express.urlencoded({ extended: true }));
   app.disable('etag');

   app.use('/data/*', async (req, res) => {
      const response = await sqserver.listen({
         signeture: req.headers['x-signeture'],
         path: req.originalUrl,
         body: req.body,
         method: req.method as any,
      }, req)

      res.status(response.status).end(response?.value);
   });

   app.get('/datas', async (req, res) => {
      const users = await User.find({
         orderBy: {
            // id: "desc",
         },
         limit: {
            take: 100
         },
         select: {
            id: true,
            name: true,
            email: true,
            metas: {
               meta_key: true,
               meta_value: true,
            },
            products: {
               id: true,
               name: true,
               categories: {
                  id: true,
                  name: true
               }
            }
         },
         where: {
            // id: {
            //    in: [
            //       1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
            //       21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
            //       41, 42, 43, 44, 45, 46, 47, 48, 49, 50
            //    ]
            // }
         }
      })

      res.json(users);
   });
   app.get('/count', async (req, res) => {
      const users = await User.find({
         where: {
            id: 1
         },
         select: {
            metas: true,
            products: {
               categories: true
            }
         }
      })
      const usersCount = await User.count({
         where: {
            id: 1
         },
         select: {
            metas: true,
            products: {
               categories: true
            }
         }
      })
      res.json({ usersCount, users });
   });
   app.get('/faker', async (req, res) => {
      const users = fakeData(10000)
      const d = await User.create({ data: users })
      res.send(d);
   });
   app.get('/delete', async (req, res) => {
      const del = await User.delete({
         where: {
            id: 2
         }
      })
      res.send(del);
   });
   app.get('/migrate', async (req, res) => {
      await db.migrate(true)
      res.send(`Migrated`);
   });

}
export default server;