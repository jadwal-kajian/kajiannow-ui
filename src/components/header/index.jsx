import logo from "assets/images/logo.png";

function Header() {
  return (
    <header className="mb-3 text-center md:text-[16px] text-sm">
      <div className="logo">
        <img src={logo} alt="kajiannow" className="mx-auto w-[70%] md:w-[250px]" />
      </div>
    </header>
  );
}

export default Header;
