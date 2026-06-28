import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock, faUser, faMosque, faCity } from "@fortawesome/free-solid-svg-icons";
import PropTypes from "prop-types";
import { formatTimeRange } from "../../utils/kajianStatus";

export const MarkerInfo = ({ group, location, showAllInfo }) => {
  const ShowNotes = () => {
    if (location.notes && location.notes !== "Cp : -") {
      return <div className="notes p-2">{location.notes}</div>;
    }
    return null;
  };

  if (group.length > 1) {
    return (
      <>
        {group.map((info, i) => {
          return (
            <div
              key={i}
              className={`marker-info relative  min-w-[300px] flex flex-col mb-2 text-sm text-ink bg-surface border border-line rounded-lg overflow-hidden ${
                showAllInfo ? "opacity-100 scale-100 visible" : "opacity-0 scale-95 invisible"
              }`}
            >
              <div className="title font-semibold p-3">{info.topic}</div>
              <div className="content px-3 pb-3">
                <div className="flex gap-3 items-center">
                  <FontAwesomeIcon icon={faUser} className="w-4 h-4 text-ink-dim flex-shrink-0" />
                  {location.speaker}
                </div>
                <div className="flex gap-3 items-center">
                  <FontAwesomeIcon icon={faMosque} className="w-4 h-4 text-ink-dim flex-shrink-0" />
                  {location.loc_name}
                </div>
                <div className="flex gap-3 items-center">
                  <FontAwesomeIcon icon={faCity} className="w-4 h-4 text-ink-dim flex-shrink-0" />
                  {location.city}
                </div>
                {info.time_start && (
                  <div className="flex gap-3 items-center">
                    <FontAwesomeIcon icon={faClock} className="w-4 h-4 text-ink-dim flex-shrink-0" />
                    {formatTimeRange(info)}
                  </div>
                )}
              </div>
              <ShowNotes />
            </div>
          );
        })}
      </>
    );
  }

  return (
    <div
      className={`marker-info min-w-[300px] flex flex-col text-sm text-ink bg-surface border border-line rounded-lg transition-opacity duration-300 overflow-hidden ${
        showAllInfo ? "opacity-100 scale-100 visible" : "opacity-0 scale-95 invisible"
      }`}
    >
      <div className="title font-semibold p-3">{location.topic}</div>
      <div className="content px-3 pb-3">
        <div className="flex gap-3 items-center">
          <FontAwesomeIcon icon={faUser} className="w-4 h-4 text-ink-dim flex-shrink-0" />
          {location.speaker}
        </div>
        <div className="flex gap-3 items-center">
          <FontAwesomeIcon icon={faMosque} className="w-4 h-4 text-ink-dim flex-shrink-0" />
          {location.loc_name}
        </div>
        <div className="flex gap-3 items-center">
          <FontAwesomeIcon icon={faCity} className="w-4 h-4 text-ink-dim flex-shrink-0" />
          {location.city}
        </div>
        {location.time_start && (
          <div className="flex gap-3 items-center">
            <FontAwesomeIcon icon={faClock} className="w-4 h-4 text-ink-dim flex-shrink-0" />
            {formatTimeRange(location)}
          </div>
        )}
      </div>
      <ShowNotes />
    </div>
  );
};

MarkerInfo.propTypes = {
  group: PropTypes.array.isRequired,
  location: PropTypes.shape({
    topic: PropTypes.string.isRequired,
    speaker: PropTypes.string.isRequired,
    loc_name: PropTypes.string.isRequired,
    time_start: PropTypes.string.isRequired,
    time_end: PropTypes.string.isRequired,
    notes: PropTypes.string,
  }).isRequired,
  showAllInfo: PropTypes.bool.isRequired,
};
