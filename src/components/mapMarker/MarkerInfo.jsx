import PropTypes from "prop-types";

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
          const x_position = i > 1 ? "left-8" : "right-[330px]";
          const y_position = i > 1 ? "bottom-[430px]" : "-top-[200px]";

          return (
            <div
              key={i}
              className={`marker-info relative ${x_position} ${y_position} min-w-[300px] flex flex-col mb-2 text-sm text-gray-800 bg-[#ffe7be] shadow-[inset_0_0_20px_-8px_#000] rounded-lg overflow-hidden ${
                showAllInfo
                  ? "opacity-100 scale-100 visible"
                  : "opacity-0 scale-95 invisible"
              }`}
            >
              <div className="title font-semibold p-2">{info.topic}</div>
              <div className="content p-2">
                <div className="speaker">
                  <span className="font-semibold mr-1">Pemateri:</span>
                  {info.speaker}
                </div>
                <div className="location">
                  <span className="font-semibold mr-1">Tempat:</span>
                  {info.loc_name}
                </div>
                <div className="time">
                  <span className="font-semibold mr-1">Waktu:</span>
                  {info.time_start} - {info.time_end}
                </div>
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
      className={`marker-info min-w-[300px] absolute -left-[130px] -bottom-[24px] flex flex-col text-sm text-gray-800 bg-[#ffe7be] shadow-[inset_0_0_20px_-8px_#000] rounded-lg transform -translate-y-1/2 transition-opacity duration-300 overflow-hidden ${
        showAllInfo
          ? "opacity-100 scale-100 visible"
          : "opacity-0 scale-95 invisible"
      }`}
    >
      <div className="title font-semibold p-2">{location.topic}</div>
      <div className="content p-2">
        <div className="speaker">
          <span className="font-semibold mr-1">Pemateri:</span>
          {location.speaker}
        </div>
        <div className="location">
          <span className="font-semibold mr-1">Tempat:</span>
          {location.loc_name}
        </div>
        <div className="time">
          <span className="font-semibold mr-1">Waktu:</span>
          {location.time_start} - {location.time_end}
        </div>
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
