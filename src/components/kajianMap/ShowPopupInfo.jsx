import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import PropTypes from "prop-types";
import SwalPopup from "components/swalPopup";

const Popup = withReactContent(Swal);

export const ShowPopupInfo = ({ location, group }) => {
  Popup.fire({
    html: (
      <SwalPopup
        type="kajian"
        info={location}
        group={group}
        close={() => Popup.close()}
      />
    ),
    showConfirmButton: false,
    allowOutsideClick: false,
  });
};

ShowPopupInfo.propTypes = {
  location: PropTypes.object.isRequired,
  group: PropTypes.array.isRequired,
};
