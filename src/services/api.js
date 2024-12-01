import axiosInstance from './axiosInstance';

export const fetchKajianData = async () => {
  try {
    const response = await axiosInstance.get('/schedule');
    return response.data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
};
