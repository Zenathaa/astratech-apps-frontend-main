import axios from "axios";
import Cookies from "js-cookie";

const JWT_TOKEN_KEY = "jwtToken";

const apiClient = axios.create({
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const jwtToken = Cookies.get(JWT_TOKEN_KEY);
    if (jwtToken) {
      config.headers.Authorization = `Bearer ${jwtToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const fetchData = async (url, param = {}, method = "POST") => {
  const normalizedMethod = method.toUpperCase();

  try {
    let response;
    switch (normalizedMethod) {
      case "GET":
        response = await apiClient.get(url, { params: param });
        break;
      case "POST":
        response = await apiClient.post(url, param);
        break;
      case "PUT":
        response = await apiClient.put(url, param);
        break;
      case "DELETE":
        response = await apiClient.delete(url, { data: param });
        break;
      default:
        throw new Error(`Metode tidak didukung: ${method}`);
    }
    return response.data;
  } catch (err) {
    if (err.response) {
      if (err.response.data) {
        return {
          error: true,
          status: err.response.status,
          ...err.response.data,
        };
      }
      return {
        error: true,
        status: err.response.status,
        message: err.response.statusText || "Server error",
      };
    } else if (err.request) {
      return {
        error: true,
        message: "Tidak ada respons dari server. Cek jaringan.",
      };
    } else {
      return { error: true, message: err.message };
    }
  }
};

export default fetchData;
