import axiosInstance from "@/utils/axiosInstance";

export const fetchProfile       = ()       => axiosInstance.get("/profile/me").then(r => r.data);
export const updateBasicInfo    = (data)   => axiosInstance.patch("/profile/basic", data).then(r => r.data);
export const updateUsername     = (data)   => axiosInstance.patch("/profile/username", data).then(r => r.data);
export const updateSocialLinks  = (data)   => axiosInstance.patch("/profile/social", data).then(r => r.data);
export const changePassword     = (data)   => axiosInstance.patch("/profile/change-password", data).then(r => r.data);
export const updatePrivacy      = (data)   => axiosInstance.patch("/profile/privacy", data).then(r => r.data);
export const updateNotifications= (data)   => axiosInstance.patch("/profile/notifications", data).then(r => r.data);
export const fetchSessions      = ()       => axiosInstance.get("/profile/sessions").then(r => r.data);
export const revokeAllSessions  = ()       => axiosInstance.delete("/profile/sessions").then(r => r.data);
export const fetchLoginHistory  = ()       => axiosInstance.get("/profile/login-history").then(r => r.data);
export const toggleOnlineStatus = (data)   => axiosInstance.patch("/profile/online-status", data).then(r => r.data);
export const fetchReferral      = ()       => axiosInstance.get("/profile/referral").then(r => r.data);
export const deactivateAccount  = ()       => axiosInstance.patch("/profile/deactivate").then(r => r.data);
export const deleteAccount      = (data)   => axiosInstance.delete("/profile/delete", { data }).then(r => r.data);
