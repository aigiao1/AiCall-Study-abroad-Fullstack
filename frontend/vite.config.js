import { resolve } from "path"; // 恢复这行，确保 alias 正常工作
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import basicSsl from "@vitejs/plugin-basic-ssl";

export default defineConfig({
  resolve: {
    alias: [
      {
        find: "@",
        replacement: resolve(__dirname, "./src"),
      },
    ],
  },
  base: "/aicall/", 
  plugins: [vue(), tailwindcss(), basicSsl()],
  server: {
    https: true,
    host: true,
    port: 5175,
    proxy: {
      // 只要请求是以 /aicall/api 开头的，全部转发！
      "/aicall/api": {
        target: "https://localhost:7003",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
