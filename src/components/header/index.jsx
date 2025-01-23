import logo_only from "assets/images/logo_only.png";
import logo_horizontal from "assets/images/logo_horizontal.png";

function Header() {
  return (
    <header className="relative flex justify-between items-center pt-[6px] mb-3 text-center md:text-[16px] text-sm">
      <div className="logo">
        <img src={logo_horizontal} alt="kajiannow" className="absolute top-0 w-[150px] hidden md:block rounded-3xl" />
        <img src={logo_only} alt="kajiannow" className="absolute top-0 w-[36px] block md:hidden rounded-3xl" />
      </div>
      <div className="title w-full text-custom-yellow-1 font-semibold tracking-wide text-sm md:text-base">
        Info Kajian Sunnah Indonesia
      </div>
    </header>
  );
}

export default Header;
