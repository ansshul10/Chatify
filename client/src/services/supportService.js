import axiosInstance from "@/utils/axiosInstance";

// User
export const createTicket    = (data) => axiosInstance.post("/support", data).then(r => r.data);
export const getMyTickets    = ()     => axiosInstance.get("/support/my").then(r => r.data);
export const getMyTicketById = (id)   => axiosInstance.get(`/support/my/${id}`).then(r => r.data);
export const userReply       = (id, message) => axiosInstance.post(`/support/my/${id}/reply`, { message }).then(r => r.data);

// Admin
export const adminGetTickets     = (params) => axiosInstance.get("/support/admin", { params }).then(r => r.data);
export const adminGetTicket      = (id)     => axiosInstance.get(`/support/admin/${id}`).then(r => r.data);
export const adminReply          = (id, data) => axiosInstance.post(`/support/admin/${id}/reply`, data).then(r => r.data);
export const adminUpdateStatus   = (id, status) => axiosInstance.patch(`/support/admin/${id}/status`, { status }).then(r => r.data);
export const adminBulkAction     = (ids, status) => axiosInstance.post("/support/admin/bulk", { ids, status }).then(r => r.data);
