import React, { useState } from 'react';
import logo from './logo.svg';
import './App.css';
import Map from './Map';
import GoogleMapWithFetch from './Mapsnew';

function App() {
  const [data, setData] = useState('');

  const fetchData = async () => {
    try {
      const response = await fetch('http://localhost:5000/schedule', {
        headers: {
          'accept': 'application/json'
        }
      });
      const result = await response.json();
      setData(JSON.stringify(result, null, 2));
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
        KajianNow!
        <br/>by Derry Pratama
        </p>
      {/* <GoogleMapWithFetch /> */}
      <Map />
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
        <button onClick={fetchData}>Get JSON</button>
        <textarea
          value={data}
          onChange={(e) => setData(e.target.value)}
          rows="10"
          cols="50"
        />
      </header>
    </div>
  );
}

export default App;