import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import LoginView from "../views/LoginView.vue";
import ChatRoom from "../views/chatroom.vue";
import HistoryList from "../views/HistoryList.vue";
import HistoryDetail from "../views/HistoryDetail.vue";
import { notify } from "@/utils/toast";

const routes = [
  {
    path: "/",
    name: "Login",
    component: LoginView,
  },
  {
    path: "/home",
    name: "Home",
    component: HomeView,
    meta: { requiresAuth: true },
  },
  {
    path: "/chatroom",
    name: "ChatRoom",
    component: ChatRoom,
    meta: { requiresAuth: true },
  },
  {
    path: "/history",
    name: "HistoryList",
    component: HistoryList,
    meta: { requiresAuth: true },
  },
  {
    path: "/history/:id",
    name: "HistoryDetail",
    component: HistoryDetail,
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory("/aicall"),
  routes,
});

router.beforeEach((to, from, next) => {
  if (!to.meta.requiresAuth) {
    next();
    return;
  }

  const token = localStorage.getItem("userToken");
  if (token) {
    next();
    return;
  }

  notify.warning("请先登录后再访问");
  next("/");
});

export default router;
