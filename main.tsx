import React from 'react';
import { createRoot } from 'react-dom/client';
import { db, ProductModel, UserModel } from './example'


const Button = ({ label, onClick }) => {
  return (
    <button
      onClick={async () => {
        await onClick()
      }}
      style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}
    >
      {label}
    </button>
  );
}

const App = () => {
  return (
    <div style={{ fontFamily: 'monospace,math, sans-serif', textAlign: 'center', marginTop: '50px' }}>

      <div style={{ marginTop: "50px" }}>
        <Button label="Find" onClick={async () => {
          const result = await UserModel.find({
            // distinct: ["email"],
            orderBy: {
              // uid: "desc",
              // email: "desc"
            },
            limit: {
              take: 100,
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
            // aggregate: {
            //    metas: {
            //       uoid: {
            //          count: true
            //       }
            //    },
            //    products: {
            //       price: {
            //          sum: {
            //             alias: "total_price"
            //          },
            //          avg: {
            //             alias: "avg_price"
            //          }
            //       }
            //    }
            // },
            select: {
              name: true,
              email: true,
              username: true,
              password: true,
              created_at: true,
              metas: {
                select: {
                  meta_key: true,
                  meta_value: true,
                },
                limit: { take: 2 }
              },
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
          console.log(result);

        }} />
        <Button label="Update" onClick={async () => {


        }} />
        <Button label="Delete" onClick={async () => {

        }} />
      </div>
    </div>
  );
}
const rootEle = document.getElementById('root')
if (rootEle) {
  const root = createRoot(rootEle);
  root.render(<App />);
}
