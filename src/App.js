import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import Map from './Map';

function App() {
  const [data, setData] = useState([]);
  const mapRef = useRef(null);

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

  const handleSetCenter = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          if (mapRef.current) {
            mapRef.current.setCenter({ lat: latitude, lng: longitude });
          }
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <p>
        KajianNow!
        <br/>Jadwal Kajian Sunnah Terupdate Setiap Hari
        </p>
        <button onClick={handleSetCenter}>Posisikan saya di tengah peta</button>
        <br/>
        <Map locations={data} ref={mapRef} />
{/*         
        <button onClick={fetchData}>Get JSON</button>
        <textarea
          value={JSON.stringify(data, null, 2)}
          onChange={(e) => setData(JSON.parse(e.target.value))}
          rows="10"
          cols="50"
        /> */}
        <p>
          &copy; 2024 <a href="https://derrylab.com" target="_blank" rel="noopener noreferrer">derrylab.com</a>
        </p>
      </header>
    </div>
  );
}

export default App;