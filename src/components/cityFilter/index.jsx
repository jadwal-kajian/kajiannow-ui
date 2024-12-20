import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import Select from "react-select";

const CityFilter = ({ cities, onCityChange }) => {
  const [selectedCity, setSelectedCity] = useState("");

  useEffect(() => {
    const filter = JSON.parse(localStorage.getItem("filter")) || null;
    if (filter) setSelectedCity(filter.selectedCity);
  }, []);

  const cityOptions = cities.map((city) => ({
    value: city || "",
    label: city || "Semua Kota",
  }));

  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      borderRadius: 12,
      border: "none",
      boxShadow: "0 0 8px -2px #b7a484",
      backgroundColor: "#f1dcb7",
      cursor: "pointer",
    }),
    menu: (provided) => ({
      ...provided,
      borderRadius: 12,
      border: "none",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
      backgroundColor: "#f1dcb7",
    }),
    option: (provided, state) => ({
      ...provided,
      borderRadius: "0.5rem",
      backgroundColor: state.isSelected ? "#f0c68f" : state.isFocused ? "#f0c68f" : "#f1dcb7",
      color: "#333",
      cursor: "pointer",
      "&:hover": {
        backgroundColor: "#f0c68f",
      },
    }),
  };

  return (
    <Select
      name="city"
      placeholder="Pilih Kota ..."
      options={cityOptions}
      value={cityOptions.find((option) => option.value === selectedCity)}
      onChange={(selectedOption) => {
        setSelectedCity(selectedOption.value);
        onCityChange(selectedOption.value);
      }}
      className="select-city mb-4 text-sm"
      styles={customStyles}
    />
  );
};

CityFilter.propTypes = {
  cities: PropTypes.arrayOf(PropTypes.string).isRequired,
  onCityChange: PropTypes.func.isRequired,
};

export default CityFilter;
