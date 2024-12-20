import React, { useState } from "react";
import CityFilter from "components/cityFilter";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import CategoryFilter from "components/categoryFilter";

function FilterPopup({ close, filter, submit }) {
  const [selectedCity, setSelectedCity] = useState("none");
  const [selectedCategories, setSelectedCategories] = useState([]);

  const applyFilter = () => {
    let currentCity = "";
    const filter = JSON.parse(localStorage.getItem("filter")) || null;
    if (filter) currentCity = filter.selectedCity;

    const dataSubmit = {
      selectedCity: selectedCity == "none" ? currentCity : selectedCity,
      selectedCategories,
    };

    localStorage.setItem("filter", JSON.stringify(dataSubmit));
    submit(dataSubmit);
  };

  return (
    <div className="relative h-[60vh] overflow-y-auto flex flex-col text-center text-base py-2 bg-custom-yellow-1 shadow-[inset_0_0_20px_-2px_#000]">
      <button
        className="sticky top-3 right-6 ml-auto px-2 p-[6px] bg-custom-yellow-4 text-gray-600 hover:text-gray-800 rounded-full flex items-center justify-center z-10 shadow-[0_0_8px_-4px_#000]"
        onClick={close}
      >
        <FontAwesomeIcon icon={faTimes} size="lg" />
      </button>
      <div className="content h-[80%] mt-4 p-3 px-6 w-full mx-auto text-left text-[13px] md:text-base">
        <CityFilter cities={filter.cities} onCityChange={setSelectedCity} />
        <CategoryFilter onCategoryChange={setSelectedCategories} />
      </div>

      <div className="action-area flex gap-2 justify-center items-center p-3 text-sm font-semibold">
        <button className="cancel p-2 px-4 rounded-full bg-[#efd8ad] text-sm font-semibold" onClick={applyFilter}>
          Terapkan Filter
        </button>
      </div>
    </div>
  );
}

export default FilterPopup;
