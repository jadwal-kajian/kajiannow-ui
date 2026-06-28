import PropTypes from "prop-types";
import { useEffect, useMemo, useState } from "react";
import { getDynamicCategory } from "../../utils/helpers";

const CategoryFilter = ({ onCategoryChange, data, resetSignal = 0 }) => {
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [categories, setCategories] = useState([]);

  // Count of kajian per tag, so each chip can show how many it would match.
  const tagCounts = useMemo(() => {
    const counts = {};
    (data || []).forEach((el) => {
      String(el.tags || "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .forEach((t) => {
          counts[t] = (counts[t] || 0) + 1;
        });
    });
    return counts;
  }, [data]);

  useEffect(() => {
    const filter = JSON.parse(localStorage.getItem("filter")) || null;
    if (filter) setSelectedCategories(filter.categories);

    const getCategories = getDynamicCategory(data);
    setCategories(getCategories);
  }, []);

  // Parent bumps resetSignal to clear the selection (Reset button). Skip the
  // initial mount so we don't wipe the persisted selection loaded above.
  useEffect(() => {
    if (resetSignal > 0) setSelectedCategories([]);
  }, [resetSignal]);

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
        <div className="flex-grow border-t border-line"></div>
        <div className="label text-sm text-ink-dim">Pilih Kategori</div>
        <div className="flex-grow border-t border-line"></div>
      </div>
      <div className="flex flex-wrap gap-2 justify-center text-[13px]">
        {categories.map((category) => {
          const active = selectedCategories.includes(category);
          return (
            <button
              key={category}
              type="button"
              aria-pressed={active}
              className={`px-[10px] py-[3px] rounded-full cursor-pointer transition-all active:scale-95 ${
                active
                  ? "bg-accent text-accent-ink" // active chip
                  : "bg-surface-2 text-ink border border-line" // inactive chip
              }`}
              onClick={() => handleCheckboxChange(category)}
            >
              {category.replace(/_/g, " ")}
              <span className={`ml-1 text-[11px] ${active ? "text-accent-ink/70" : "text-ink/60"}`}>
                {tagCounts[category] ?? 0}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

CategoryFilter.propTypes = {
  onCategoryChange: PropTypes.func.isRequired,
  data: PropTypes.array,
  resetSignal: PropTypes.number,
};

export default CategoryFilter;
