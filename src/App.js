import React, { useState, useEffect } from 'react';
import './App.css';
import Map from './Map';

function App() {
  const [data, setData] = useState([]);

  const fetchData = async () => {
    try {
      const response = await fetch('https://kajian-api.derrylab.com/schedule', {
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
        <p>
        KajianNow!
        <br/>by derrylab
        </p>
        <Map locations={data} />
        <button onClick={fetchData}>Get JSON</button>
        <textarea
          value={JSON.stringify(data, null, 2)}
          onChange={(e) => setData(JSON.parse(e.target.value))}
          rows="10"
          cols="50"
        />
        <p>
          &copy; 2024 <a href="https://derrylab.com" target="_blank" rel="noopener noreferrer">derrylab.com</a>. All rights reserved.
        </p>
      </header>
    </div>
  );
}

export default App;