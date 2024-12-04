import React, { useEffect, useState } from "react";
import { GET_LAST_UPDATE } from "services/api";
import { convertDateTime } from "../../utils/helpers";
import logo from "assets/images/logo.png";

function Header() {
  const [lastUpdate, setLastUpdate] = useState();

  useEffect(() => {
    fetchLastUpdate();
  }, []);

  const fetchLastUpdate = async () => {
    try {
      const result = await GET_LAST_UPDATE();
      setLastUpdate(convertDateTime(result));
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  return (
    <header className="mb-3 text-center md:text-[16px] text-sm">
      <div className="logo">
        <img src={logo} alt="kajiannow" className="mx-auto w-[70%] md:w-[250px]" />
      </div>
      <div className="slogan font-semibold">Jadwal Terupdate Setiap Hari</div>
      <div className="updated-info font-semibold">Kajian Sunnah {lastUpdate}</div>
    </header>
  );
}

export default Header;
