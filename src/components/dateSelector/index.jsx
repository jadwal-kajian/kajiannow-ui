import PropTypes from "prop-types";
import { useState, useEffect } from "react";
import DatePicker, { registerLocale } from "react-datepicker";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendar } from "@fortawesome/free-regular-svg-icons";
import { customIdLocale, ID_FormattedDate } from "../../utils/helpers";

import "react-datepicker/dist/react-datepicker.css";
import "./style.scss";

registerLocale("custom-id", customIdLocale);

const DateSelector = ({ selectedDate, setDateSelected }) => {
  const [chosenDate, setChosenDate] = useState(new Date());
  const [displayDate, setDisplayDate] = useState("");

  useEffect(() => {
    setDisplayDate(ID_FormattedDate(selectedDate));
    setChosenDate(selectedDate);
  }, [selectedDate]);

  const handleChange = (e) => {
    setChosenDate(e);
    setDateSelected(e);
    setDisplayDate(ID_FormattedDate(e));
  };

  return (
    <div className="select-date relative mb-6 text-sm">
      <div className="flex items-center gap-4 my-2">
        <div className="flex-grow border-t border-custom-yellow-4"></div>
        <div className="label text-sm text-[#917951]">Pilih Tanggal</div>
        <div className="flex-grow border-t border-custom-yellow-4"></div>
      </div>
      <DatePicker
        showIcon
        selected={chosenDate}
        onChange={handleChange}
        wrapperClassName="w-full"
        calendarClassName="custom-datepicker-popup"
        locale="custom-id" // Use the custom locale
        customInput={
          <div className="relative text-sm">
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-[#7a5530]">
              <FontAwesomeIcon icon={faCalendar} />
            </div>
            <input
              type="text"
              className="w-full py-2 h-[38px] !px-4 rounded-lg bg-[#f1dcb7] text-[#7a5530] font-semibold placeholder-[#7a5530] shadow-[0_0_8px_-2px_#b7a484] focus:outline-none"
              placeholder="Pilih Tanggal"
              onChange={handleChange}
              value={displayDate}
            />
          </div>
        }
      />
    </div>
  );
};

DateSelector.propTypes = {
  selectedDate: PropTypes.instanceOf(Date).isRequired,
  setDateSelected: PropTypes.func.isRequired,
};

export default DateSelector;
