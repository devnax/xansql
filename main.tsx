import React from 'react';
import { createRoot } from 'react-dom/client';
import { x } from './src/Types';
import { Xansql, Schema } from './src';
import MysqlDialect from './src/Dialects/Mysql';

const UserSchema = new Schema("users", {
  id: x.id(),
  name: x.string().index(),
  email: x.string().unique(),
  age: x.number().integer().default(18),
  creator: x.join("users", "creators").optional(),
  created_at: x.date(),
});

const PostSchema = new Schema("posts", {
  id: x.id(),
  title: x.string().index(),
  content: x.string(),
  user: x.join('users', 'posts').optional(),
  customer: x.join('users', "customer_posts").optional()
});

const db = new Xansql({
  dialect: MysqlDialect,
  connection: ""
})

const UserModel = db.model(UserSchema)
const PostModel = db.model(PostSchema)

UserModel.find({
  where: {
    name: "Hello World",

    creator: {
      name: "John Doe",
      age: { gte: 18 },
      creators: {
        id: 1,
        name: "Jane Doe",
        creators: [
          {
            id: 2,
            name: "Alice Smith"
          },
          {
            id: 1,
            name: "Alice Smith"
          }
        ]
      },
    },
    // posts: {
    //   title: "Hello World",
    // }
  },
  select: {
    id: true,
    posts: {
      select: {},
    }
  },
  limit: {

  },
  orderBy: {
    createdAt: 'desc'
  }
})
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
