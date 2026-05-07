import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";
import router from "./router";
import Toast from "vue-toastification";
import "vue-toastification/dist/index.css";
const app = createApp(App);
import { initVhListener } from "./utils/setvh"
window.addEventListener("vite:preloadError", (event) => {
  console.error(event)
  window.location.reload() // 刷新页面
})
initVhListener()

app.use(router);
app.use(Toast, {
  position: "top-center",
  timeout: 2800,
  hideProgressBar: true,
  closeButton: false,
  newestOnTop: true,
  transition: "Vue-Toastification__fade",
  toastClassName:
    "rounded-[20px] border border-sky-100 bg-white/96 text-slate-700 shadow-[0_18px_60px_rgba(59,130,246,0.16)] backdrop-blur",
  bodyClassName: "px-1 py-0 text-[14px] font-medium",
});
app.mount("#app");
