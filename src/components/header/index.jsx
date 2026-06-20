import logo_only from "assets/images/logo_only.png";
import logo_horizontal from "assets/images/logo_horizontal.png";
import { ThemeToggle } from "../../theme";

function Header() {
  return (
    <header className="relative flex items-center gap-2 pt-[6px] mb-3 md:text-[16px] text-sm">
      <div className="logo flex-shrink-0">
        <img src={logo_horizontal} alt="kajiannow" className="w-[150px] hidden md:block rounded-3xl" />
        <img src={logo_only} alt="kajiannow" className="w-[36px] block md:hidden rounded-3xl" />
      </div>
      <div className="title flex-1 min-w-0 text-center text-accent font-bold tracking-wide text-sm md:text-base truncate">
        Info Kajian Sunnah Indonesia
      </div>
      <ThemeToggle className="flex-shrink-0" />
    </header>
  );
}

export default Header;
