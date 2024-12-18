import axiosInstance from "./axiosInstance";

export const GET_ALL_KAJIAN = async (date) => {
  try {
    const response = await axiosInstance.get(`/schedule?date=${date}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
};

export const GET_LAST_UPDATE = async () => {
  try {
    const response = await axiosInstance.get("/last_update");
    return response.data;
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
};
