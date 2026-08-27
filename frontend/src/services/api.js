import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use(
  (config) => {
    let token = sessionStorage.getItem("access_token");
    if (!token) {
      token = localStorage.getItem("access_token") || localStorage.getItem("heritage_token");
      if (token) {
        sessionStorage.setItem("access_token", token);
      }
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      // Do not force redirect for initial auth check
      if (originalRequest.url === "/auth/me") {
        return Promise.reject(error);
      }

      if (originalRequest.url === "/auth/refresh") {
         sessionStorage.removeItem("access_token");
         localStorage.removeItem("access_token");
         localStorage.removeItem("heritage_token");
         localStorage.removeItem("heritage_refresh_token");
         if (!window.location.pathname.includes("/login") && !window.location.pathname.includes("/register")) {
           window.location.href = "/login";
         }
         return Promise.reject(error);
      }

      originalRequest._retry = true;
      const refreshToken = localStorage.getItem("heritage_refresh_token");
      
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE_URL}/auth/refresh`, { refresh_token: refreshToken });
          if (res.data && res.data.access_token) {
            sessionStorage.setItem("access_token", res.data.access_token);
            localStorage.setItem("access_token", res.data.access_token);
            localStorage.setItem("heritage_token", res.data.access_token);
            
            originalRequest.headers.Authorization = `Bearer ${res.data.access_token}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          // Token refresh failed, continue to logout below
        }
      }
      
      // Stale token or refresh failed, clear storage and redirect to login
      sessionStorage.removeItem("access_token");
      localStorage.removeItem("access_token");
      localStorage.removeItem("heritage_token");
      localStorage.removeItem("heritage_refresh_token");
      error.message = "Session expired. Please log in again.";
      // Only redirect if not already on the login/register page
      if (!window.location.pathname.includes("/login") && !window.location.pathname.includes("/register")) {
        window.location.href = "/login";
      }
    } else if (!error.response && (error.code === "ERR_NETWORK" || error.message?.includes("Network Error"))) {
      error.message = "Network Error: Cannot connect to backend server. Please make sure the FastAPI backend is running on http://127.0.0.1:8000.";
    }
    return Promise.reject(error);
  }
);

// Helper methods
api.login = async (phone, password) => {
  const formData = new URLSearchParams();
  formData.append("username", phone);
  formData.append("password", password);

  const res = await api.post("/auth/login", formData, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
  if (res.data && res.data.access_token) {
    sessionStorage.setItem("access_token", res.data.access_token);
    localStorage.setItem("access_token", res.data.access_token);
    localStorage.setItem("heritage_token", res.data.access_token);
    if (res.data.refresh_token) {
      localStorage.setItem("heritage_refresh_token", res.data.refresh_token);
    }
  }
  return res.data;
};

api.register = async (name, phone, password) => {
  const res = await api.post("/auth/register", { name, phone, password });
  if (res.data && res.data.access_token) {
    sessionStorage.setItem("access_token", res.data.access_token);
    localStorage.setItem("access_token", res.data.access_token);
    localStorage.setItem("heritage_token", res.data.access_token);
    if (res.data.refresh_token) {
      localStorage.setItem("heritage_refresh_token", res.data.refresh_token);
    }
  }
  return res.data;
};

api.getMe = async () => {
  try {
    const res = await api.get("/auth/me");
    return res.data;
  } catch (e) {
    return null;
  }
};

api.logout = () => {
  sessionStorage.removeItem("access_token");
  localStorage.removeItem("access_token");
  localStorage.removeItem("heritage_token");
  localStorage.removeItem("heritage_refresh_token");
  localStorage.removeItem("heritage_user");
};

api.changePassword = async (current_password, new_password) => {
  const res = await api.put("/auth/change-password", {
    current_password,
    new_password,
  });
  return res.data;
};

api.requestPasswordReset = async (phone) => {
  const res = await api.post("/auth/request-reset-otp", { phone });
  return res.data;
};

api.resetPassword = async (phone, otp, new_password) => {
  const res = await api.post("/auth/reset-password", { phone, otp, new_password });
  return res.data;
};


api.getFoodItems = async () => {
  const res = await api.get("/food-items");
  return res.data;
};

api.likeFoodItem = async (id) => {
  const res = await api.post(`/food-items/${id}/like`);
  return res.data;
};

api.unlikeFoodItem = async (id) => {
  const res = await api.delete(`/food-items/${id}/like`);
  return res.data;
};

api.createFoodItem = async (itemData) => {
  const res = await api.post("/admin/food-items", itemData);
  return res.data;
};

api.updateFoodItem = async (id, itemData) => {
  const res = await api.put(`/admin/food-items/${id}`, itemData);
  return res.data;
};

api.deleteFoodItem = async (id) => {
  const res = await api.delete(`/admin/food-items/${id}`);
  return res.data;
};

api.placeOrder = async (orderPayload) => {
  const res = await api.post("/orders", orderPayload);
  return res.data;
};

api.getCustomerOrders = async () => {
  const res = await api.get("/orders");
  return res.data;
};

api.getAdminOrders = async () => {
  const res = await api.get("/admin/orders");
  return res.data;
};

api.getAdminStatistics = async (startDate, endDate) => {
  let url = "/admin/statistics";
  const params = new URLSearchParams();
  if (startDate) params.append("start_date", startDate);
  if (endDate) params.append("end_date", endDate);
  
  if (params.toString()) {
    url += `?${params.toString()}`;
  }
  const res = await api.get(url);
  return res.data;
};

api.updateOrderStatus = async (orderId, newStatus) => {
  const res = await api.put(`/admin/orders/${orderId}/status`, { status: newStatus });
  return res.data;
};

api.getAdminComplaints = async () => {
  const res = await api.get("/admin/complaints");
  return res.data;
};

api.resolveComplaint = async (id) => {
  const res = await api.put(`/admin/complaints/${id}/resolve`);
  return res.data;
};

api.submitComplaint = async (payload) => {
  const res = await api.post("/complaints", payload);
  return res.data;
};

api.getAdminUsers = async () => {
  const res = await api.get('/admin/users');
  return res.data;
};

api.createAdminUser = async (payload) => {
  const res = await api.post('/admin/users', payload);
  return res.data;
};

api.deleteAdminUser = async (id) => {
  const res = await api.delete(`/admin/users/${id}`);
  return res.data;
};

api.updateAdminUser = async (id, payload) => {
  const res = await api.put(`/admin/users/${id}`, payload);
  return res.data;
};

api.deleteAdminOrder = async (id) => {
  const res = await api.delete(`/admin/orders/${id}`);
  return res.data;
};

api.deleteAdminComplaint = async (id) => {
  const res = await api.delete(`/admin/complaints/${id}`);
  return res.data;
};

export { api };
export default api;
