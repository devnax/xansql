import React from 'react';
import { createRoot } from 'react-dom/client';
import { db, ProductModel, UserModel } from './example'


const Button = ({ label, onClick }: any) => {
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
  const [file, setFile] = React.useState<File | null>(null);
  return (
    <div style={{ fontFamily: 'monospace,math, sans-serif', textAlign: 'center', marginTop: '50px' }}>
      <input type="file" onChange={(e) => {
        const file = e.target.files ? e.target.files[0] : null;
        setFile(file);
      }} />
      <div style={{ marginTop: "50px" }}>
        <Button label="Find" onClick={async () => {
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
              // uid: { gt: 100 }
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
          console.log(result);

        }} />
        <Button label="Create" onClick={async () => {
          let longText = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.".repeat(1000); // ~5MB
          // const file = new File([longText], 'hello.txt', { type: 'text/plain' });

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
              name: "John Doe",
              email: `john${Math.floor(Math.random() * 10000)}@doe.com`,
              password: "password",
              photo: file,
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
