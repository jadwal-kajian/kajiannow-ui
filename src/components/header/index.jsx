import React from "react";
import logo from "assets/images/logo.png";

function Header() {
  return (
    <header className="mb-3 text-center">
      <div className="logo">
        <img src={logo} alt="kajiannow" className="mx-auto w-[70%] md:w-[30%]" />
      </div>
      <div className="slogan font-semibold text-sm md:text-[16px]">Jadwal Kajian Sunnah Terupdate Setiap Hari</div>
    </header>
  );
}

export default Header;
