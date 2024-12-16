import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilter } from "@fortawesome/free-solid-svg-icons";

const FloatingFilterButton = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-4 right-4 w-14 h-14 bg-primary text-red-700 bg-white rounded-full shadow-lg flex items-center justify-center z-50 hover:bg-primary-dark transition-colors"
      aria-label="Open filters"
    >
      <FontAwesomeIcon icon={faFilter} className="text-xl" />
    </button>
  );
};

FloatingFilterButton.propTypes = {
  onClick: PropTypes.func.isRequired,
};

export default FloatingFilterButton;
