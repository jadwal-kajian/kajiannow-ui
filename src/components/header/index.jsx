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
    <header className="mb-3 text-center">
      <div className="logo">
        <img src={logo} alt="kajiannow" className="mx-auto w-[50%] md:w-[20%]" />
      </div>
      <div className="slogan mb-1 font-semibold text-sm md:text-[16px]">Jadwal Kajian Sunnah Terupdate Setiap Hari</div>
      <div className="updated-info font-semibold">{lastUpdate}</div>
    </header>
  );
}

export default Header;
