import { useEffect, useState, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faEyeSlash,
  faInfoCircle,
} from "@fortawesome/free-solid-svg-icons";
import MapParent from "components/mapParent";
import { GET_ALL_KAJIAN } from "services/api";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import SwalPopup from "components/swalPopup";

const Popup = withReactContent(Swal);

const Home = () => {
  const [data, setData] = useState([]);
  const [showAllInfo, setShowAllInfo] = useState(false);
  const mapRef = useRef(null);

  const fetchData = async () => {
    try {
      const result = await GET_ALL_KAJIAN();
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
    Popup.fire({
      html: <SwalPopup type={"petunjuk"} close={() => Popup.close()} />,
      showConfirmButton: false,
    });
  };

  return (
    <div className="content">
      <MapParent locations={data} ref={mapRef} showAllInfo={showAllInfo} />

      <div className="action-area w-full flex justify-center items-center gap-2">
        {/* <img src={info} alt="info" onClick={showInfo} className="w-[42px] cursor-pointer" /> */}

        <button
          onClick={showInfo}
          className="relative w-[36px] h-[36px] text-[40px] border-none rounded-full bg-[#545454] text-[#ffe7be] cursor-pointer overflow-hidden shadow-[inset_0_0_8px_-2px_#000]"
        >
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <FontAwesomeIcon icon={faInfoCircle} />
          </span>
        </button>

        <button
          onClick={() => setShowAllInfo(!showAllInfo)}
          className="relative w-[36px] h-[36px] text-lg p-2 border-none rounded-full bg-[#ffe7be] text-[#545454] cursor-pointer overflow-hidden shadow-[inset_0_0_8px_-2px_#000]"
        >
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            {showAllInfo ? (
              <FontAwesomeIcon icon={faEyeSlash} />
            ) : (
              <FontAwesomeIcon icon={faEye} />
            )}
          </span>
        </button>

        <button
          onClick={handleSetCenter}
          className="my-3 py-2 px-6 border-none rounded-full bg-[#ffe7be] text-[#545454] font-semibold shadow-[inset_0_0_12px_-2px_#000]"
        >
          Lokasi Saya
        </button>
      </div>

      <div className="quotes text-center my-6 md:mt-12 mb-8 text-[12px] md:text-base">
        <i>
          Barangsiapa yang menempuh suatu jalan untuk mencari ilmu, <br />
          maka Allah akan memudahkan baginya jalan menuju surga. <br />
          (HR. Muslim)
        </i>
      </div>
    </div>
  );
};

export default Home;
