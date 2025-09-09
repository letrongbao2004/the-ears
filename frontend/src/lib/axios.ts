import axios from "axios";

export const axiosInstance = axios.create({
	baseURL: import.meta.env.MODE === "development" ? "http://localhost:5000/api" : "/api",
});

// Add response interceptor to handle 401 errors
axiosInstance.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response?.status === 401) {
			// Clear auth token and redirect to login
			delete axiosInstance.defaults.headers.common['Authorization'];
			window.location.href = '/sign-in';
		}
		return Promise.reject(error);
	}
);