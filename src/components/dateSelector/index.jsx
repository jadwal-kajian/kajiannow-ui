import PropTypes from "prop-types";
import { useState, useEffect } from "react";
import DatePicker, { registerLocale } from "react-datepicker";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendar, faCircleLeft } from "@fortawesome/free-regular-svg-icons";
import { customIdLocale, ID_FormattedDate } from "../../utils/helpers";
import { getYear, getMonth } from "date-fns";
import { faCircleChevronLeft, faCircleChevronRight } from "@fortawesome/free-solid-svg-icons";

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

  const years = Array.from({ length: getYear(new Date()) - 1990 + 1 }, (_, i) => 1990 + i);
  const months = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

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
        locale="custom-id"
        renderCustomHeader={({
          date,
          changeYear,
          changeMonth,
          decreaseMonth,
          increaseMonth,
          prevMonthButtonDisabled,
          nextMonthButtonDisabled,
        }) => (
          <div className="flex justify-between items-center px-4 py-2">
            <button onClick={decreaseMonth} disabled={prevMonthButtonDisabled} className="absolute left-[-8px] top-[-8px] text-[#7a5530]">
              <FontAwesomeIcon icon={faCircleChevronLeft} className="text-[32px]" />
            </button>
            <div className="flex items-center gap-2">
              <select
                value={getYear(date)}
                onChange={({ target: { value } }) => changeYear(Number(value))}
                className="outline-none border border-[#917951] bg-[#f1dcb7] rounded-lg px-2 py-1"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <select
                value={getMonth(date)}
                onChange={({ target: { value } }) => changeMonth(Number(value))}
                className="outline-none border border-[#917951] bg-[#f1dcb7] rounded-lg px-2 py-1"
              >
                {months.map((month, index) => (
                  <option key={index} value={index}>
                    {month}
                  </option>
                ))}
              </select>
            </div>
            <button onClick={increaseMonth} disabled={nextMonthButtonDisabled} className="absolute right-[-8px] top-[-8px] text-[#7a5530]">
              <FontAwesomeIcon icon={faCircleChevronRight} className="text-[32px]" />
            </button>
          </div>
        )}
        customInput={
          <div className="relative text-sm">
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-[#7a5530]">
              <FontAwesomeIcon icon={faCalendar} />
            </div>
            <input
              readOnly
              type="text"
              className="w-full py-2 h-[38px] !px-4 rounded-lg bg-[#f1dcb7] text-[#7a5530] font-semibold placeholder-[#7a5530] shadow-[0_0_8px_-2px_#b7a484] focus:outline-none cursor-pointer"
              placeholder="Pilih Tanggal"
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
