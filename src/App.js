import React, { useState, useEffect } from 'react';
import logo from './logo.svg';
import './App.css';
import Map from './Map';

function App() {
  const [data, setData] = useState([]);

  const fetchData = async () => {
    try {
      const response = await fetch('http://arm.derrylab.com:9090/schedule', {
        headers: {
          'accept': 'application/json'
        }
      });
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
        KajianNow!
        <br/>by Derry Pratama
        </p>
        <Map locations={data} />
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
          value={JSON.stringify(data, null, 2)}
          onChange={(e) => setData(JSON.parse(e.target.value))}
          rows="10"
          cols="50"
        />
      </header>
    </div>
  );
}

export default App;