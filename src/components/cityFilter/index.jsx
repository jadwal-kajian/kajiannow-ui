import PropTypes from "prop-types";
import Select from "react-select";

const CityFilter = ({ cities, selectedCity, onCityChange }) => {
  console.log(cities, selectedCity);

  return (
    <div className="mb-4">
      <label htmlFor="category-select" className="block text-sm font-medium text-gray-700 mb-1">
        Pilih Kota
      </label>
      <select
        value={selectedCity}
        onChange={(e) => onCityChange(e.target.value)}
        className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
      >
        <option value="">Semua Kota</option>
        {cities.map((city) => (
          <option key={city} value={city}>
            {city}
          </option>
        ))}
      </select>

      {/* <Select
        className="basic-select"
        name="city"
        options={cities}
        value={selectedCity}
        onChange={(e) => {
          onCityChange(e.city);
        }}
      /> */}
    </div>
  );
};

CityFilter.propTypes = {
  cities: PropTypes.arrayOf(PropTypes.string).isRequired,
  selectedCity: PropTypes.string.isRequired,
  onCityChange: PropTypes.func.isRequired,
};

export default CityFilter;
