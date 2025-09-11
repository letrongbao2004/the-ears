import axios from "axios";
import { getTokenGetter } from "./authToken";

export const axiosInstance = axios.create({
	baseURL: import.meta.env.MODE === "development" ? "http://localhost:5000/api" : "/api",
});

// Attach fresh token on each request
axiosInstance.interceptors.request.use(async (config) => {
	try {
		const getToken = getTokenGetter();
		if (getToken) {
			const token = await getToken();
			if (token) {
				config.headers = config.headers ?? {};
				(config.headers as any).Authorization = `Bearer ${token}`;
			}
		}
	} catch {}
	return config;
});

// Keep 401 handler
axiosInstance.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response?.status === 401) {
			delete axiosInstance.defaults.headers.common['Authorization'];
		}
		return Promise.reject(error);
	}
);