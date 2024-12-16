import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilter } from "@fortawesome/free-solid-svg-icons";

const FloatingFilterButton = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="relative w-[36px] h-[36px] text-lg p-2 border-none rounded-full bg-custom-yellow-1 text-custom-gray-1 cursor-pointer overflow-hidden shadow-[inset_0_0_8px_-2px_#000]"
      aria-label="Open filters"
    >
      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <FontAwesomeIcon icon={faFilter} className="text-sm" />
      </span>
    </button>
  );
};

FloatingFilterButton.propTypes = {
  onClick: PropTypes.func.isRequired,
};

export default FloatingFilterButton;
