import BASE_URL from "./config";
import { serialize } from '../utils/helpers';

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
  try {
    const response = await BASE_URL.get(`/query_schedules?${serialize(query)}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
};

// Register a Web Push subscription (+ location and alert thresholds) so the
// backend can push when a nearby kajian is about to start.
export const PUSH_SUBSCRIBE = async (payload) => {
  const response = await BASE_URL.post("/push/subscribe", payload);
  return response.data;
};

// Drop a Web Push subscription by its endpoint.
export const PUSH_UNSUBSCRIBE = async (endpoint) => {
  const response = await BASE_URL.delete("/push/subscribe", { data: { endpoint } });
  return response.data;
};