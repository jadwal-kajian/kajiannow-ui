import PropTypes from "prop-types";

const categories = [
  "tematik",
  "rutin",
  "kitab",
  "anak",
  "dauroh",
  "tabligh_akbar",
  "tahsin",
  "tafsir",
  "rumah_tangga",
  "aqidah",
  "fiqih",
  "bahasa_arab",
  "khusus_akhwat",
];

const CategoryFilter = ({ selectedCategories, onCategoryChange }) => {
  const handleChange = (category) => {
    const updatedCategories = selectedCategories.includes(category)
      ? selectedCategories.filter((c) => c !== category)
      : [...selectedCategories, category];
    onCategoryChange(updatedCategories);
  };

  return (
    <div className="mb-4">
      <h3 className="block text-sm font-medium text-gray-700 mb-2">
        Pilih Kategori:
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {categories.map((category) => (
          <label key={category} className="inline-flex items-center">
            <input
              type="checkbox"
              className="form-checkbox h-5 w-5 text-indigo-600"
              checked={selectedCategories.includes(category)}
              onChange={() => handleChange(category)}
            />
            <span className="ml-2 text-sm text-gray-700">
              {category.replace("_", " ")}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
};

CategoryFilter.propTypes = {
  selectedCategories: PropTypes.arrayOf(PropTypes.string).isRequired,
  onCategoryChange: PropTypes.func.isRequired,
};

export default CategoryFilter;
