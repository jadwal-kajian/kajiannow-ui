import PropTypes from "prop-types";
import { useState, useEffect } from "react";
import moment from "moment";

const DateSelector = ({ selectedDate, onChange }) => {
  const [displayDate, setDisplayDate] = useState("");

  const formatDate = (date) => {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  useEffect(() => {
    setDisplayDate(formatDate(selectedDate));
  }, [selectedDate]);

  const handleChange = (e) => {
    const newDate = new Date(e.target.value);
    onChange(newDate);
    setDisplayDate(formatDate(newDate));
  };

  return (
    <div className="date-selector mb-2 relative">
      <input
        type="date"
        value={moment(selectedDate).format("YYYY-MM-DD")}
        onChange={handleChange}
        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
        aria-label="Select date"
      />
      <div
        className="bg-custom-yellow-1 text-custom-gray-1 cursor-pointer overflow-hidden shadow-[inset_0_0_8px_-2px_#000] py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-custom-yellow-1"
        style={{
          WebkitAppearance: "none",
          MozAppearance: "none",
          appearance: "none",
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='4' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Cline x1='16' y1='2' x2='16' y2='6'%3E%3C/line%3E%3Cline x1='8' y1='2' x2='8' y2='6'%3E%3C/line%3E%3Cline x1='3' y1='10' x2='21' y2='10'%3E%3C/line%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 8px center",
          paddingRight: "32px",
        }}
      >
        {displayDate}
      </div>
    </div>
  );
};

DateSelector.propTypes = {
  selectedDate: PropTypes.instanceOf(Date).isRequired,
  onChange: PropTypes.func.isRequired,
};

export default DateSelector;
