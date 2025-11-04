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

          // const l = await db.log?.find({
          //   where: {
          //     id: { gt: 0 }
          //   },
          //   orderBy: { id: 'desc' },
          //   limit: { take: 10 },
          // })
          // console.log(l);
          // return


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
            where: {
              uid: { gt: 100 }
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
