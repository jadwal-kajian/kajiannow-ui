import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import ContributorsPopup from "../swalPopup/contents/contributors";

const MySwal = withReactContent(Swal);

function Footer() {
  const showContributors = () => {
    MySwal.fire({
      html: <ContributorsPopup close={() => MySwal.close()} />,
      showConfirmButton: false,
    });
  };

  return (
    <footer className="flex flex-col items-center mt-auto">
      <div className="flex gap-1">
        <div className="copyright">&copy; {new Date().getFullYear()}</div>
        by
        <button onClick={showContributors} className='text-blue-300'>
          contributors
        </button>
      </div>
      <div className="flex gap-1">
        hosted on
        <a href="https://derrylab.com" target="_blank" rel="noopener noreferrer" className='text-blue-300'>
          derrylab.com
        </a>
      </div>
      <a
        href="https://github.com/jadwal-kajian/kajiannow-ui"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 mt-1 text-blue-300"
        aria-label="Kode sumber di GitHub (open source)"
      >
        <FontAwesomeIcon icon={faGithub} />
        open source
      </a>
    </footer>
  );
}

export default Footer;
