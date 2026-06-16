import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilter, faTimes } from "@fortawesome/free-solid-svg-icons";
import DateSelector from "../../dateSelector";
import CityFilter from "../../cityFilter";
import CategoryFilter from "../../categoryFilter";

function FilterPopup({ close, filter, submit }) {
  const [selectedCity, setSelectedCity] = useState("none");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [dateSelected, setDateSelected] = useState(filter.selectedDate);

  const applyFilter = () => {
    let currentCity = "";
    const localFilter = JSON.parse(localStorage.getItem("filter")) || null;
    if (localFilter) currentCity = localFilter.city;

    const dataSubmit = {
      city: selectedCity == "none" ? currentCity : selectedCity,
      categories: selectedCategories,
      date: dateSelected,
    };

    localStorage.setItem("filter", JSON.stringify(dataSubmit));
    submit(dataSubmit);
  };

  return (
    <div className="relative h-[65vh] overflow-y-auto flex flex-col text-center text-base py-2 bg-custom-yellow-1 shadow-[inset_0_0_20px_-2px_#000]">
      <button
        className="sticky top-3 right-6 ml-auto px-2 p-[6px] bg-custom-yellow-4 text-gray-600 hover:text-gray-800 rounded-full flex items-center justify-center z-10 shadow-[0_0_8px_-4px_#000]"
        onClick={close}
      >
        <FontAwesomeIcon icon={faTimes} size="lg" />
      </button>
      <div className="content h-[80%] p-3 px-6 w-full mx-auto text-left text-[13px] overflow-y-auto md:text-base">
        <DateSelector selectedDate={dateSelected} setDateSelected={setDateSelected} />
        <CityFilter cities={filter.cities} cityCounts={filter.cityCounts} setSelectedCity={setSelectedCity} />
        <CategoryFilter data={filter.allData} onCategoryChange={setSelectedCategories} />
      </div>

      <div className="action-area flex gap-2 justify-center items-center p-3 text-sm font-semibold">
        <button
          className="cancel p-2 px-6 rounded-full bg-[#7a5530] text-[#f1dcb7] text-sm font-semibold"
          onClick={applyFilter}
        >
          <FontAwesomeIcon icon={faFilter} className="text-sm mr-2" />
          Terapkan Filter
        </button>
      </div>
    </div>
  );
}

export default FilterPopup;
