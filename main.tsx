import React from 'react';
import { createRoot } from 'react-dom/client';
import { x } from './src/Types';
import { Xansql, Schema } from './src';
import MysqlDialect from './src/Dialects/Mysql';
import { PostModel } from './example'

PostModel.create({
  data: {
    title: "Hello World",
    content: "This is a test post",

    user: {
      name: "John Doe",
      email: "",

      posts: [
        {
          title: "Nested Post",
          content: "This is a nested post"
        }
      ]
    }
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
