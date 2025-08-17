import React from 'react';
import { createRoot } from 'react-dom/client';
import { db, User } from './example';
import { column, Schema } from './src/xanv';

const UserSchema = new Schema("users", {
  id: column.id(),
  name: column.string().index(),
  email: column.string().unique(),
  age: column.number().integer().default(18),
  creator: column.schema("users"),
});

const UserMetaSchema = new Schema("user_metas", {
  id: column.id(),
  key: column.string().index(),
  value: column.string(),
  user: UserSchema,
  customer: UserSchema
});

const ProductSchema = new Schema("products", {
  id: column.id(),
  name: column.string().index(),
  price: column.number().default(0),
  description: column.string(),
  tags: column.set(column.string()),
  createdAt: column.date().default(new Date()),
  updatedAt: column.date().default(new Date()),
  user: UserSchema
});

const OrderSchema = new Schema("orders", {
  id: column.id(),
  customer: UserSchema,
  product: ProductSchema,
  quantity: column.number().default(1),
  totalPrice: column.number().default(0),
  status: column.enum(["pending", "completed", "cancelled"]),
  createdAt: column.date().default(new Date()),
  updatedAt: column.date().default(new Date()),
});

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
            data: [
              {
                name: "John Doe",
                email: "well@gmail.com",
                password: "123456",
                metas: [
                  {
                    meta_key: "Product 1",
                    meta_value: 100,
                  },
                ]
              },
              {
                name: "John Doe",
                email: "well@gmail.com",
                password: "123456",
              }
            ]
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
