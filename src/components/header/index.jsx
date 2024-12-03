import React, { useEffect, useState } from "react";
import logo from "assets/images/logo.png";

function Header() {
  const [date, setDate] = useState("");

  useEffect(() => {
    fetch('https://kajian-api.derrylab.com/last_update', {
      headers: { 'accept': 'application/json' }
    })
      .then(response => response.json())
      .then(data => {
        const lastUpdate = new Date(data.last_update);
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        setDate(lastUpdate.toLocaleDateString('id-ID', options));
      })
      .catch(error => console.error('Error fetching date:', error));
  }, []);

  return (
    <header className="mb-3 text-center">
      <div className="logo">
        <img src={logo} alt="kajiannow" className="mx-auto w-[70%] md:w-[30%]" />
      </div>
      <div className="slogan font-semibold text-sm md:text-[16px]">Jadwal Terupdate Setiap Hari</div>
      <div className="slogan font-semibold text-sm md:text-[16px]">Kajian Sunnah Hari {date}</div>
    </header>
  );
}

export default Header;
