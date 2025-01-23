import React, { useState } from "react";

const LaporPopup = ({ close }) => {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    const phoneNumber = "+6287712607883"; // Replace with the actual phone number
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <div className="relative flex flex-col text-center text-base py-2 bg-custom-yellow-1 shadow-[inset_0_0_20px_-2px_#000]">
      <div className="title pb-2 font-semibold p-3">
        <span className="label mx-2">Laporkan Masalah/Saran Tentang Jadwal atau Kajian</span>
      </div>
      <div className="content p-3 max-w-[90%] md:max-w-full mx-auto flex flex-col gap-2 text-[13px] md:text-base">
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
      <div className="action-area flex gap-2 justify-center items-center p-3 text-sm font-semibold">
        <button className="cancel p-2 px-4 rounded-full bg-[#efd8ad] text-sm font-semibold" onClick={close}>
          Tutup
        </button>
        <button
          className="submit p-2 px-6 rounded-full bg-[#7a5530] text-[#f1dcb7] text-sm font-semibold"
          onClick={handleSend}
        >
          Kirim
        </button>
      </div>
    </div>
  );
};

export default LaporPopup;
