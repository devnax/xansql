import React from 'react';
import { createRoot } from 'react-dom/client';
import { User } from './example';

const c = async () => {
  const users = await User.find({
    orderBy: {
      id: "desc",
    },
    limit: {
      take: 100
    },
    where: {
      id: 1
    }
  })
  console.log(users);

}

c()

const App = () => {
  return (
    <div style={{ fontFamily: 'monospace,math, sans-serif', textAlign: 'center', marginTop: '50px' }}>
      <h1>Welcome to makepack CLI!</h1>
      <p>Edit <code>index.tsx</code> and save to reload.</p>
      <a
        href="https://reactjs.org"
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: '#61dafb', textDecoration: 'none' }}
      >
        Learn React
      </a>
      <div style={{ marginTop: "50px" }}>
        <button
          onClick={async () => {

          }}
          style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}
        >
          Click Me
        </button>
      </div>
    </div>
  );
}
const rootEle = document.getElementById('root')
if (rootEle) {
  const root = createRoot(rootEle);
  root.render(<App />);
}
