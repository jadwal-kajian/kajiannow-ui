import React, { useState } from "react";
import { MODAL_SHELL, MODAL_TITLE, MODAL_CONTENT, MODAL_ACTIONS, BTN_PRIMARY, CloseButton } from "./modalStyles";

const LaporPopup = ({ close }) => {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    const phoneNumber = "+6287712607883"; // Replace with the actual phone number
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <div className={MODAL_SHELL}>
      <CloseButton onClose={close} />
      <div className={MODAL_TITLE}>
        <span className="label mx-2">Laporkan Masalah/Saran Tentang Jadwal atau Kajian</span>
      </div>
      <div className={MODAL_CONTENT}>
        <p>Silakan laporkan masalah / saran yang Anda temui di aplikasi ini.</p>
        <p>Semoga Allah membalas kebaikan atas kontribusi Anda.</p>
        <textarea
          className="w-full p-3 border border-gray-300 rounded mb-4 bg-[#fff8e1]"
          rows="4"
          placeholder={`Contoh:\n- Ada kekeliruan jadwal kajian di lokasi x tidak sesuai...\n- Bisakah menambahkan kajian di lokasi z, saya ada grup whatsappnya...`}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        ></textarea>
      </div>
      <div className={MODAL_ACTIONS}>
        <button className={BTN_PRIMARY} onClick={handleSend}>
          Kirim
        </button>
      </div>
    </div>
  );
};

export default LaporPopup;
