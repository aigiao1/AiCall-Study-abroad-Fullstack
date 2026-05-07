import axios from "axios";
import { notify } from "./toast";

const baseURL = import.meta.env.DEV ? "/aicall/api" : "https://123.com.cn";

const service = axios.create({
  baseURL,
  timeout: 100000,
  headers: {
    "Content-Type": "application/json",
  },
});

service.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("userToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

service.interceptors.response.use(
  (response) => {
    if (response.status >= 200 && response.status < 300) {
      return response.data;
    }
    return Promise.reject(response);
  },
  (error) => {
    if (error.response) {
      switch (error.response.status) {
        case 404:
          notify.error("接口不存在 (404)");
          break;
        case 500:
          notify.error("服务器异常 (500)");
          break;
        default:
          notify.error("发生未知错误");
      }
    }
    return Promise.reject(error);
  },
);

export default service;
