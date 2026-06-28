import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import Select from "react-select";

const CityFilter = ({ cities, cityCounts = {}, setSelectedCity, resetSignal = 0 }) => {
  const [chosenCity, setChosenCity] = useState("");

  useEffect(() => {
    const filter = JSON.parse(localStorage.getItem("filter")) || null;
    if (filter) setChosenCity(filter.city);
  }, []);

  // Parent bumps resetSignal to clear back to "Semua Kota".
  useEffect(() => {
    if (resetSignal > 0) {
      setChosenCity("");
      setSelectedCity("");
    }
  }, [resetSignal]);

  const totalCount = Object.values(cityCounts).reduce((sum, n) => sum + n, 0);

  const cityOptions = [
    {
      value: "",
      label: `Semua Kota (${totalCount})`,
    },
    // Skip blank city names (bad data) — they'd render a nameless "(n)" row that collides with "Semua Kota".
    ...cities
      .filter((city) => city && String(city).trim() !== "")
      .map((city) => ({
        value: city,
        label: `${city} (${cityCounts[city] ?? 0})`,
      })),
  ];

  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      paddingLeft: 8,
      borderRadius: 12,
      border: "none",
      boxShadow: "0 0 0 1px var(--kn-border)",
      backgroundColor: "var(--kn-surface-2)",
      color: "var(--kn-text)",
      cursor: "pointer",
    }),
    singleValue: (provided) => ({
      ...provided,
      color: "var(--kn-accent)",
      fontWeight: 600,
    }),
    menu: (provided) => ({
      ...provided,
      borderRadius: 12,
      border: "none",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
      backgroundColor: "var(--kn-surface-2)",
    }),
    option: (provided, state) => ({
      ...provided,
      borderRadius: "0.5rem",
      backgroundColor: state.isSelected
        ? "var(--kn-accent)"
        : state.isFocused
          ? "var(--kn-surface)"
          : "var(--kn-surface-2)",
      color: state.isSelected ? "var(--kn-accent-ink)" : "var(--kn-text)",
      cursor: "pointer",
      "&:hover": {
        backgroundColor: "var(--kn-surface)",
      },
    }),
  };

  return (
    <div className="city-area my-3 mb-6">
      <div className="flex items-center gap-4 my-2">
        <div className="flex-grow border-t border-line"></div>
        <div className="label text-sm text-ink-dim">Pilih Kota</div>
        <div className="flex-grow border-t border-line"></div>
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
        isSearchable={false}
        className="select-city mb-4 text-sm"
        styles={customStyles}
      />
    </div>
  );
};

CityFilter.propTypes = {
  cities: PropTypes.arrayOf(PropTypes.string).isRequired,
  cityCounts: PropTypes.objectOf(PropTypes.number),
  setSelectedCity: PropTypes.func.isRequired,
  resetSignal: PropTypes.number,
};

export default CityFilter;
