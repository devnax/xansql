import React from 'react';
import { createRoot } from 'react-dom/client';
import xansql from './src';
// export const mysql = new xansql("")

import alasql from 'alasql'
// Create separate instances
const db1 = new alasql.Database();
const db2 = new alasql.Database();

db1.exec('CREATE TABLE cities (city STRING, population NUMBER);');
db1.exec("INSERT INTO cities VALUES ('Rome',2863223);");

db2.exec('CREATE TABLE cities (city STRING, population NUMBER);');
db2.exec("INSERT INTO cities VALUES ('Madrid',3041579);");
db2.exec("INSERT INTO cities VALUES ('London',3344);");

const cities = [
  { city: 'Rome', population: 2863223 },
  { city: 'Paris', population: 2249975 },
  { city: 'Berlin', population: 3517424 },
  { city: 'Madrid', population: 3041579 },
];
const query = 'SELECT * FROM ? WHERE population < 3500000 ORDER BY population DESC';
const result = alasql(query, [cities]);

console.log('DB1:', result);
console.log('DB2:', db2.exec('SELECT * FROM cities'));

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
