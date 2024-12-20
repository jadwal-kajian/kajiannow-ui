import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import Select from "react-select";

const CityFilter = ({ cities, setSelectedCity }) => {
  const [chosenCity, setChosenCity] = useState("");

  useEffect(() => {
    const filter = JSON.parse(localStorage.getItem("filter")) || null;
    if (filter) setChosenCity(filter.city);
  }, []);

  const cityOptions = [
    {
      value: "",
      label: "Semua Kota",
    },
    ...cities.map((city) => ({
      value: city,
      label: city,
    })),
  ];

  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      paddingLeft: 8,
      borderRadius: 12,
      border: "none",
      boxShadow: "0 0 8px -2px #b7a484",
      backgroundColor: "#f1dcb7",
      cursor: "pointer",
    }),
    singleValue: (provided) => ({
      ...provided,
      color: "#7a5530",
      fontWeight: 600,
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
      color: "#7a5530",
      cursor: "pointer",
      "&:hover": {
        backgroundColor: "#f0c68f",
      },
    }),
  };

  return (
    <div className="city-area my-3 mb-6">
      <div className="flex items-center gap-4 my-2">
        <div className="flex-grow border-t border-custom-yellow-4"></div>
        <div className="label text-sm text-[#917951]">Pilih Kota</div>
        <div className="flex-grow border-t border-custom-yellow-4"></div>
      </div>
      <Select
        name="city"
        placeholder="Pilih Kota ..."
        options={cityOptions}
        value={cityOptions.find((option) => option.value === chosenCity)}
        onChange={(selectedOption) => {
          setChosenCity(selectedOption.value);
          setSelectedCity(selectedOption.value);
        }}
        className="select-city mb-4 text-sm"
        styles={customStyles}
      />
    </div>
  );
};

CityFilter.propTypes = {
  cities: PropTypes.arrayOf(PropTypes.string).isRequired,
  setSelectedCity: PropTypes.func.isRequired,
};

export default CityFilter;
