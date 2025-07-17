import React from 'react';
import { createRoot } from 'react-dom/client';
import { db, User } from './example';

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

        <Button label="Insert" onClick={async () => {

          const user = await User.create({
            data: {
              name: "John Doe",
              email: "well@gmail.com",
              password: "123456",
            }
          })
          console.log(user);

        }} />
        <Button label="Find" onClick={async () => {
          const users = await User.find({
            orderBy: {
              // id: "desc",
            },
            limit: {
              take: 1
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
                user: true,
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
          console.log(users);
        }} />
        <Button label="Update" onClick={async () => {
          const user = await User.update({
            data: {
              name: "Update Name",
            },
            where: {
              email: "well@gmail.com"
            },
          })

          console.log(user);

        }} />
        <Button label="Delete" onClick={async () => {
          const user = await User.delete({
            where: {
              email: "well@gmail.com"
            },
          })
          console.log(user);

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
