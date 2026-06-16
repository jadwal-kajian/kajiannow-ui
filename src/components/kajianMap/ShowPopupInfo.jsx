import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import PropTypes from "prop-types";
import SwalPopup from "../../components/swalPopup";

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
    // Drop the default zoom/fade so the popup appears instantly on tap (felt laggy on mobile).
    showClass: { popup: "", backdrop: "" },
    hideClass: { popup: "", backdrop: "" },
  });
};

ShowPopupInfo.propTypes = {
  location: PropTypes.object.isRequired,
  group: PropTypes.array.isRequired,
};
