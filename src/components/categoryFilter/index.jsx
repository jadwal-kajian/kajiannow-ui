import PropTypes from "prop-types";
import { useEffect, useState } from "react";

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

const CategoryFilter = ({ onCategoryChange }) => {
  const [selectedCategories, setSelectedCategories] = useState([]);

  useEffect(() => {
    const filter = JSON.parse(localStorage.getItem("filter")) || null;
    if (filter) setSelectedCategories(filter.selectedCategories);
  }, []);

  useEffect(() => {
    onCategoryChange(selectedCategories);
  }, [selectedCategories]);

  const handleCheckboxChange = (category) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((item) => item !== category) : [...prev, category]
    );
  };

  return (
    <div className="category-area my-3">
      <div className="flex items-center gap-4 my-4">
        <div className="flex-grow border-t border-custom-yellow-4"></div>
        <div className="label text-sm text-[#917951]">Pilih Kategori</div>
        <div className="flex-grow border-t border-custom-yellow-4"></div>
      </div>
      <div className="flex flex-wrap gap-2 justify-center text-[13px]">
        {categories.map((category) => (
          <div
            key={category}
            className={`px-[10px] py-[2px] rounded-full cursor-pointer transition-all ${
              selectedCategories.includes(category)
                ? "bg-[#795548] text-white" // Warna chip aktif
                : "bg-[#ebd7b4] text-[#7A5530]" // Warna chip tidak aktif
            }`}
            onClick={() => handleCheckboxChange(category)}
          >
            {category.replace("_", " ")}
          </div>
        ))}
      </div>
    </div>
  );
};

CategoryFilter.propTypes = {
  onCategoryChange: PropTypes.func.isRequired,
};

export default CategoryFilter;
