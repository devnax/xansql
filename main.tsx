import React from 'react';
import { createRoot } from 'react-dom/client';
import { Product, User } from './example/db-client';
import { USER_ROLES } from './example/Schema';


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
          const results = await User.find({
            where: {
              // uid: 10
              // customer: null,

            },
            select: {
              photo: true,
              products: {
                select: {
                  categories: {
                    select: {
                      sub_categories: true
                    }
                  }
                }
              }
            }
          })
          console.log(results);
        }} />
        <Button label="Create" onClick={async () => {
          // const file = new File([new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])], "image.png", { type: "image/png" });

          const results = await User.create({
            data: {
              name: "asdasd",
              age: 20,
              role: USER_ROLES.ADMIN,
              email: Math.random() + "asd@gmail.com",
              photo: file as any
            }
          })
          console.log(results);

        }} />
        <Button label="Delete" onClick={async () => {
          const del = await User.delete({
            where: {
              uid: 2
            }
          })

          console.log(del);

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
