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


const App = () => {
  return (
    <div style={{ fontFamily: 'monospace,math, sans-serif', textAlign: 'center', marginTop: '50px' }}>

      <div style={{ marginTop: "50px" }}>
        <button
          onClick={async () => {
            c()
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
