import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import LoginView from "../views/LoginView.vue";
import ChatRoom from "../views/chatroom.vue";
import HistoryList from "../views/HistoryList.vue";
import HistoryDetail from "../views/HistoryDetail.vue";
import DashboardView from "../views/DashboardView.vue";
import StudyAbroadView from "../views/StudyAbroadView.vue";
import InterviewView from "../views/InterviewView.vue";
import EnglishCoachView from "../views/EnglishCoachView.vue";
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
    path: "/study-abroad",
    name: "StudyAbroad",
    component: StudyAbroadView,
    meta: { requiresAuth: true },
  },
  {
    path: "/interview",
    name: "Interview",
    component: InterviewView,
    meta: { requiresAuth: true },
  },
  {
    path: "/english-coach",
    name: "EnglishCoach",
    component: EnglishCoachView,
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
  {
    path: "/dashboard",
    name: "Dashboard",
    component: DashboardView,
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
