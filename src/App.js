import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import Map from './Map';

function App() {
  const [data, setData] = useState([]);
  const [showAllInfo, setShowAllInfo] = useState(false);
  const [lastUpdate, setLastUpdate] = useState('');
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

  const fetchLastUpdate = async () => {
    try {
      const response = await fetch('https://kajian-api.derrylab.com/last_update', {
        headers: {
          'accept': 'application/json'
        }
      });
      const result = await response.json();
      const date = new Date(result.last_update);
      const dayName = date.toLocaleDateString('id-ID', { weekday: 'long' });
      const formattedDate = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
      const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
      setLastUpdate(`${dayName}, ${formattedDate} (${time})`);
    } catch (error) {
      console.error('Error fetching last update:', error);
    }
  };

  useEffect(() => {
    fetchData();
    fetchLastUpdate();
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

  const toggleShowAllInfo = () => {
    setShowAllInfo(!showAllInfo);
  };

  return (
    <div className="App">
      <header className="App-header">
        <p>
          <b>KajianNow!</b> - Jadwal Kajian Sunnah Terupdate Setiap Hari
          <br/><i>Barangsiapa yang menempuh suatu jalan untuk mencari ilmu, maka Allah akan memudahkan baginya jalan menuju surga. (HR. Muslim)</i>
        </p>
        <p>Update Terakhir: {lastUpdate}</p>
        <Map locations={data} ref={mapRef} showAllInfo={showAllInfo} />
        <p style={{ fontSize: '14px' }}>
          <b>Penggunaan:</b>
          <br/>- Titik merah merupakan lokasi dan jadwal kajian.
          <br/>- Klik titik merah untuk melihat detail informasi kajian dan membuka peta.
          <br/>- Klik "Tampilkan Semua Info" untuk melihat semua jadwal.
        </p>
        <button onClick={handleSetCenter} style={{ margin: '10px', padding: '10px 20px', border: 'none', borderRadius: '5px', background: '#007BFF', color: 'white', cursor: 'pointer', width: '250px' }}>
          Posisikan Peta Sesuai Lokasi Saya
        </button>
        <button onClick={toggleShowAllInfo} style={{ margin: '10px', padding: '10px 20px', border: 'none', borderRadius: '5px', background: '#007BFF', color: 'white', cursor: 'pointer', width: '250px' }}>
          {showAllInfo ? 'Sembunyikan Semua Info' : 'Tampilkan Semua Info'}
        </button>
        
        <br/>
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