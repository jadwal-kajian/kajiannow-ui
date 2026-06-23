import { lazy, Suspense } from "react";
import KajianPopup from "./contents/kajian";
import "./style.scss";

// The filter sheet pulls in react-select + react-datepicker (~90KB gz). It's
// opened on demand, so lazy-load it to keep those off the initial map render.
const FilterPopup = lazy(() => import("./contents/filter"));
const PetunjukPopup = lazy(() => import("./contents/petunjuk"));

function SwalPopup(data) {
  const { type, info, group, close, filter, submit } = data;

  if (type == "kajian") {
    return <KajianPopup info={info} group={group} close={close} />;
  }

  const fallback = (
    <div className="flex items-center justify-center py-12 bg-surface text-ink-dim">Memuat…</div>
  );
  if (type == "filter") {
    return (
      <Suspense fallback={fallback}>
        <FilterPopup close={close} filter={filter} submit={submit} />
      </Suspense>
    );
  }
  return (
    <Suspense fallback={fallback}>
      <PetunjukPopup close={close} />
    </Suspense>
  );
}

export default SwalPopup;
