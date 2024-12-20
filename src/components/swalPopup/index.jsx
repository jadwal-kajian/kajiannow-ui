import FilterPopup from "./contents/filter";
import PetunjukPopup from "./contents/petunjuk";
import KajianPopup from "./contents/kajian";
import "./style.scss";

function SwalPopup(data) {
  const { type, info, group, close, filter, submit } = data;

  if (type == "kajian") {
    return <KajianPopup info={info} group={group} close={close} />;
  } else if (type == "filter") {
    return <FilterPopup close={close} filter={filter} submit={submit} />;
  } else {
    return <PetunjukPopup close={close} />;
  }
}

export default SwalPopup;
