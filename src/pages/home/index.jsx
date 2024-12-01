import React, { useEffect, useState, useRef } from "react";
import KajianMap from "components/kajianMap";
import { fetchKajianData } from "services/api";
import Swal from "sweetalert2";
import info from "assets/icons/info.png";

const Home = () => {
  const [data, setData] = useState([]);
  const [showAllInfo, setShowAllInfo] = useState(false);
  const mapRef = useRef(null);

  const fetchData = async () => {
    try {
      const result = await fetchKajianData(); // Call the service function
      setData(result);
    } catch (error) {
      console.error("Error fetching data:", error);
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

  const showInfo = () => {
    Swal.fire({
      html: `
        <div style="display: flex; gap: 8px; flex-direction: column; text-align: left;">
          <div style="position: relative; padding-left: 20px;">
            <span style="position: absolute; left: 0; top: 0; font-size: 20px;">&#8226;</span>
            Titik merah menunjukkan lokasi dan jadwal kajian
          </div>
          <div style="position: relative; padding-left: 20px;">
            <span style="position: absolute; left: 0; top: 0; font-size: 20px;">&#8226;</span>
            Untuk melihat detail kajian dan peta, klik titik merah
          </div>
        </div>
      `,
      icon: "info",
      confirmButtonText: "Syukron",
    });
  };

  return (
    <div className="content">
      <KajianMap locations={data} ref={mapRef} showAllInfo={showAllInfo} />

      <div className="action-area w-full flex justify-center items-center gap-2">
        <img src={info} alt="info" onClick={showInfo} className="w-[42px] cursor-pointer" />
        <button onClick={handleSetCenter} className="my-3 py-2 px-4 border-none rounded-lg bg-[#5d438b]">
          Posisikan Peta Sesuai Lokasi Saya
        </button>
      </div>

      <div className="quotes text-center my-6 md:mt-12 mb-8 text-[12px] md:text-base">
        <i>
          Barangsiapa yang menempuh suatu jalan untuk mencari ilmu, <br />
          maka Allah akan memudahkan baginya jalan menuju surga. <br />
          (HR. Muslim)
        </i>
      </div>

      {/* <button
        onClick={() => setShowAllInfo(!showAllInfo)}
        className="my-2 py-2 px-4 border-none rounded-lg bg-blue-600 text-white cursor-pointer w-60"
      >
        {showAllInfo ? "Sembunyikan Semua Info" : "Tampilkan Semua Info"}
      </button> */}
    </div>
  );
};

export default Home;
