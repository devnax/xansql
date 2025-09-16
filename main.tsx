import React from 'react';
import { createRoot } from 'react-dom/client';
import { x } from './src/Types';
import { Xansql, Schema } from './src';
import MysqlDialect from './src/Dialects/Mysql';
import { chunkArray, chunkNumbers } from './src/utils/chunk';


// --- Example usage ---
// 1️⃣ Array pagination
const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
for (const page of chunkArray(arr, 2)) console.log(page);

for (const page of chunkNumbers(10, 3)) console.log(page);

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
        {/* 
        <Button label="Find" onClick={async () => {

        }} />
        <Button label="Update" onClick={async () => {


        }} />
        <Button label="Delete" onClick={async () => {

        }} /> */}
      </div>
    </div>
  );
}
const rootEle = document.getElementById('root')
if (rootEle) {
  const root = createRoot(rootEle);
  root.render(<App />);
}
