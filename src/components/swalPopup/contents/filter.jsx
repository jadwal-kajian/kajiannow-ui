import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilter } from "@fortawesome/free-solid-svg-icons";
import DateSelector from "../../dateSelector";
import CityFilter from "../../cityFilter";
import CategoryFilter from "../../categoryFilter";
import { MODAL_ACTIONS, BTN_PRIMARY, CloseButton } from "./modalStyles";

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
      <CloseButton onClose={close} sticky />
      <div className="content h-[80%] p-3 px-6 w-full mx-auto text-left text-[13px] overflow-y-auto md:text-base">
        <DateSelector selectedDate={dateSelected} setDateSelected={setDateSelected} />
        <CityFilter cities={filter.cities} cityCounts={filter.cityCounts} setSelectedCity={setSelectedCity} />
        <CategoryFilter data={filter.allData} onCategoryChange={setSelectedCategories} />
      </div>

      <div className={MODAL_ACTIONS}>
        <button className={BTN_PRIMARY} onClick={applyFilter}>
          <FontAwesomeIcon icon={faFilter} className="text-sm mr-2" />
          Terapkan Filter
        </button>
      </div>
    </div>
  );
}

export default FilterPopup;
