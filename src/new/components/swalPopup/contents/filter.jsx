import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilter, faRotateLeft } from "@fortawesome/free-solid-svg-icons";
import DateSelector from "../../dateSelector";
import CityFilter from "../../cityFilter";
import CategoryFilter from "../../categoryFilter";
import { MODAL_ACTIONS, BTN_PRIMARY, BTN_SECONDARY, ModalHeader, CloseButton } from "./modalStyles";

function FilterPopup({ close, filter, submit }) {
  const [selectedCity, setSelectedCity] = useState("none");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [dateSelected, setDateSelected] = useState(filter.selectedDate);
  // Bumped to tell CityFilter/CategoryFilter to clear their internal selection.
  const [resetSignal, setResetSignal] = useState(0);

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

  const resetFilter = () => {
    setSelectedCity("");
    setSelectedCategories([]);
    setResetSignal((n) => n + 1);
    try {
      localStorage.removeItem("filter");
    } catch {
      // ignore storage failures
    }
  };

  return (
    <div className="relative h-[65vh] overflow-y-auto flex flex-col text-center text-base py-2 bg-surface text-ink">
      <CloseButton onClose={close} sticky />
      <ModalHeader icon={faFilter} title="Filter Kajian" />
      <div className="content h-[80%] p-3 px-6 w-full mx-auto text-left text-[13px] overflow-y-auto md:text-base">
        <DateSelector selectedDate={dateSelected} setDateSelected={setDateSelected} />
        <CityFilter cities={filter.cities} cityCounts={filter.cityCounts} setSelectedCity={setSelectedCity} resetSignal={resetSignal} />
        <CategoryFilter data={filter.allData} onCategoryChange={setSelectedCategories} resetSignal={resetSignal} />
      </div>

      <div className={MODAL_ACTIONS}>
        <button className={BTN_SECONDARY} onClick={resetFilter}>
          <FontAwesomeIcon icon={faRotateLeft} className="text-sm mr-2" />
          Reset
        </button>
        <button className={BTN_PRIMARY} onClick={applyFilter}>
          <FontAwesomeIcon icon={faFilter} className="text-sm mr-2" />
          Terapkan Filter
        </button>
      </div>
    </div>
  );
}

export default FilterPopup;
