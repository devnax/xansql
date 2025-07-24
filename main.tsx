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
            where: {
              email: "well@gmail.com",
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
