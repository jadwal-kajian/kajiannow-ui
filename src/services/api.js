import BASE_URL from "./axiosInstance";
import { serialize } from 'utils/helpers';

export const GET_ALL_KAJIAN = async (date) => {
  try {
    const response = await BASE_URL.get(`/schedule?date=${date}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
};

export const GET_LAST_UPDATE = async () => {
  try {
    const response = await BASE_URL.get("/last_update");
    return response.data;
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
};

export const GET_KAJIAN_QUERY = async (query) => {
  const setQuery = serialize(query);
  try {
    const response = await BASE_URL.get(`/schedule?${setQuery}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
};