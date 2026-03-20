import axiosInstance from "@/utils/axiosInstance";

export const registerUser = async (data) => {
  const res = await axiosInstance.post("/auth/register", data);
  return res.data;
};

export const loginUser = async (data) => {
  const res = await axiosInstance.post("/auth/login", data);
  return res.data;
};

export const logoutUser = async () => {
  const res = await axiosInstance.post("/auth/logout");
  return res.data;
};

export const getMe = async () => {
  const res = await axiosInstance.get("/auth/me");
  return res.data;
};

export const checkUsername = async (username) => {
  const res = await axiosInstance.get(`/auth/check-username?username=${username}`);
  return res.data;
};

export const forgotPassword = async (email) => {
  const res = await axiosInstance.post("/auth/forgot-password", { email });
  return res.data;
};

export const resetPassword = async (token, password) => {
  const res = await axiosInstance.post(`/auth/reset-password/${token}`, { password });
  return res.data;
};
 
