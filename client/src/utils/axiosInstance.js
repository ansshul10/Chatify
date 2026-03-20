import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL + "/api",  // http://localhost:5000/api
  withCredentials: true,                           // cookie always send
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401 pe silently fail, AuthContext handle karega
    return Promise.reject(error);
  }
);

export default axiosInstance;
