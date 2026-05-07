<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { notify } from "@/utils/toast";

const router = useRouter();

const isLoginMode = ref(true);
const isLoading = ref(false);

const loginForm = ref({
  username: "",
  password: "",
  rememberMe: false,
});

const registerForm = ref({
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
  agreeTerms: false,
});

const loginErrors = ref({});
const registerErrors = ref({});

const validateLoginForm = () => {
  const errors = {};
  if (!loginForm.value.username.trim()) {
    errors.username = "Please enter username";
  }
  if (!loginForm.value.password) {
    errors.password = "Please enter password";
  } else if (loginForm.value.password.length < 6) {
    errors.password = "The password length must be at least 6 characters";
  }
  loginErrors.value = errors;
  return Object.keys(errors).length === 0;
};

const validateRegisterForm = () => {
  const errors = {};
  if (!registerForm.value.username.trim()) {
    errors.username = "Please enter username";
  } else if (registerForm.value.username.length < 3) {
    errors.username = "The username length must be at least 3 characters";
  }
  if (!registerForm.value.email.trim()) {
    errors.email = "Please enter email";
  } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(registerForm.value.email)) {
    errors.email = "Please enter a valid email";
  }
  if (!registerForm.value.password) {
    errors.password = "Please enter password";
  } else if (registerForm.value.password.length < 6) {
    errors.password = "The password length must be at least 6 characters";
  }
  if (!registerForm.value.confirmPassword) {
    errors.confirmPassword = "Please confirm password";
  } else if (registerForm.value.password !== registerForm.value.confirmPassword) {
    errors.confirmPassword = "The two entered passwords do not match";
  }
  if (!registerForm.value.agreeTerms) {
    errors.agreeTerms = "Please agree to the user agreement and privacy policy";
  }
  registerErrors.value = errors;
  return Object.keys(errors).length === 0;
};

const handleLogin = async () => {
  if (!validateLoginForm()) return;
  isLoading.value = true;
  try {
    const response = await fetch("/aicall/api/account/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: loginForm.value.username,
        password: loginForm.value.password,
      }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Login failed, please check the account password");
    }
    const result = await response.json();
    localStorage.setItem("userToken", result.token);
    if (loginForm.value.rememberMe) {
      localStorage.setItem("rememberedUsername", loginForm.value.username);
    }
    notify.success("Login successful");
    router.push("/home");
  } catch (error) {
    console.error("Login failed:", error);
    notify.error(error.message || "Login failed, please check the username and password");
  } finally {
    isLoading.value = false;
  }
};

const handleRegister = async () => {
  if (!validateRegisterForm()) return;
  isLoading.value = true;
  try {
    const response = await fetch("/aicall/api/account/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: registerForm.value.username,
        email: registerForm.value.email,
        password: registerForm.value.password,
      }),
    });
    if (!response.ok) {
      const errorMsg = await response.text();
      throw new Error(errorMsg || "Registration failed");
    }
    notify.success("Registration successful, please sign in");
    isLoginMode.value = true;
  } catch (error) {
    console.error("Registration failed:", error);
    notify.error(error.message || "Registration failed, please try again later");
  } finally {
    isLoading.value = false;
  }
};

const toggleMode = () => {
  isLoginMode.value = !isLoginMode.value;
  loginErrors.value = {};
  registerErrors.value = {};
};

if (localStorage.getItem("rememberedUsername")) {
  loginForm.value.username = localStorage.getItem("rememberedUsername");
  loginForm.value.rememberMe = true;
}
</script>

<template>
  <div class="min-h-screen px-4 py-8">
    <div class="flex min-h-screen items-center justify-center">
      <div class="w-full max-w-[440px] rounded-[32px] border border-white/70 bg-white/78 p-5 shadow-[0_30px_90px_rgba(148,163,184,0.24)] backdrop-blur-xl sm:p-7">
        <div class="mb-8 flex items-start justify-between gap-4">
          <div class="space-y-3">
            <p class="text-[11px] font-semibold uppercase tracking-[0.38em] text-sky-500/80">
              AI Customer Service
            </p>
            <h1 class="font-[var(--font-display)] text-4xl font-semibold tracking-tight text-slate-900">
              {{ isLoginMode ? "Bright access for your team" : "Create a polished workspace" }}
            </h1>
            <p class="max-w-sm text-sm leading-7 text-slate-500">
              {{ isLoginMode ? "Sign in to continue the voice concierge workflow." : "Provision a new account and keep the product experience unified." }}
            </p>
          </div>
          <div class="rounded-[24px] border border-sky-100 bg-sky-50/90 p-3 shadow-inner shadow-sky-100/80">
            <img src="../assets/image/robot.png" alt="AI Robot" class="h-14 w-14 rounded-[18px] object-cover" />
          </div>
        </div>

        <div class="mb-6 flex rounded-full border border-slate-200 bg-slate-50 p-1">
          <button
            type="button"
            class="flex-1 rounded-full px-4 py-2 text-sm font-semibold transition"
            :class="isLoginMode ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'"
            @click="isLoginMode = true"
          >
            Sign in
          </button>
          <button
            type="button"
            class="flex-1 rounded-full px-4 py-2 text-sm font-semibold transition"
            :class="!isLoginMode ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'"
            @click="isLoginMode = false"
          >
            Register
          </button>
        </div>

        <form v-if="isLoginMode" class="space-y-4" @submit.prevent="handleLogin">
          <div class="space-y-2">
            <label class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Username</label>
            <input
              v-model="loginForm.username"
              type="text"
              placeholder="Please enter username"
              class="h-13 w-full rounded-2xl border bg-white px-4 text-slate-700 outline-none transition placeholder:text-slate-300"
              :class="loginErrors.username ? 'border-rose-300 ring-4 ring-rose-100/70' : 'border-slate-200 focus:border-sky-300 focus:ring-4 focus:ring-sky-100/80'"
            />
            <p v-if="loginErrors.username" class="text-sm text-rose-500">{{ loginErrors.username }}</p>
          </div>

          <div class="space-y-2">
            <label class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Password</label>
            <input
              v-model="loginForm.password"
              type="password"
              placeholder="Please enter password"
              class="h-13 w-full rounded-2xl border bg-white px-4 text-slate-700 outline-none transition placeholder:text-slate-300"
              :class="loginErrors.password ? 'border-rose-300 ring-4 ring-rose-100/70' : 'border-slate-200 focus:border-sky-300 focus:ring-4 focus:ring-sky-100/80'"
            />
            <p v-if="loginErrors.password" class="text-sm text-rose-500">{{ loginErrors.password }}</p>
          </div>

          <div class="flex items-center justify-between gap-3 text-sm text-slate-500">
            <label class="flex items-center gap-2">
              <input v-model="loginForm.rememberMe" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-sky-500 focus:ring-sky-300" />
              <span>Remember me</span>
            </label>
            <button type="button" class="font-medium text-sky-500 transition hover:text-sky-400">Forgot password?</button>
          </div>

          <button
            type="submit"
            class="flex h-13 w-full items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:bg-sky-500 disabled:opacity-60"
            :disabled="isLoading"
          >
            <span v-if="!isLoading">Login</span>
            <span v-else class="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
          </button>
        </form>

        <form v-else class="space-y-4" @submit.prevent="handleRegister">
          <div class="space-y-2">
            <label class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Username</label>
            <input
              v-model="registerForm.username"
              type="text"
              placeholder="Please enter username"
              class="h-13 w-full rounded-2xl border bg-white px-4 text-slate-700 outline-none transition placeholder:text-slate-300"
              :class="registerErrors.username ? 'border-rose-300 ring-4 ring-rose-100/70' : 'border-slate-200 focus:border-sky-300 focus:ring-4 focus:ring-sky-100/80'"
            />
            <p v-if="registerErrors.username" class="text-sm text-rose-500">{{ registerErrors.username }}</p>
          </div>

          <div class="space-y-2">
            <label class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Email</label>
            <input
              v-model="registerForm.email"
              type="email"
              placeholder="Please enter email address"
              class="h-13 w-full rounded-2xl border bg-white px-4 text-slate-700 outline-none transition placeholder:text-slate-300"
              :class="registerErrors.email ? 'border-rose-300 ring-4 ring-rose-100/70' : 'border-slate-200 focus:border-sky-300 focus:ring-4 focus:ring-sky-100/80'"
            />
            <p v-if="registerErrors.email" class="text-sm text-rose-500">{{ registerErrors.email }}</p>
          </div>

          <div class="space-y-2">
            <label class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Password</label>
            <input
              v-model="registerForm.password"
              type="password"
              placeholder="Please enter password"
              class="h-13 w-full rounded-2xl border bg-white px-4 text-slate-700 outline-none transition placeholder:text-slate-300"
              :class="registerErrors.password ? 'border-rose-300 ring-4 ring-rose-100/70' : 'border-slate-200 focus:border-sky-300 focus:ring-4 focus:ring-sky-100/80'"
            />
            <p v-if="registerErrors.password" class="text-sm text-rose-500">{{ registerErrors.password }}</p>
          </div>

          <div class="space-y-2">
            <label class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Confirm password</label>
            <input
              v-model="registerForm.confirmPassword"
              type="password"
              placeholder="Please confirm password"
              class="h-13 w-full rounded-2xl border bg-white px-4 text-slate-700 outline-none transition placeholder:text-slate-300"
              :class="registerErrors.confirmPassword ? 'border-rose-300 ring-4 ring-rose-100/70' : 'border-slate-200 focus:border-sky-300 focus:ring-4 focus:ring-sky-100/80'"
            />
            <p v-if="registerErrors.confirmPassword" class="text-sm text-rose-500">{{ registerErrors.confirmPassword }}</p>
          </div>

          <label class="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-500">
            <input v-model="registerForm.agreeTerms" type="checkbox" class="mt-1 h-4 w-4 rounded border-slate-300 text-sky-500 focus:ring-sky-300" />
            <span>
              I have read and agree to the
              <button type="button" class="font-medium text-sky-500">User Agreement</button>
              and
              <button type="button" class="font-medium text-sky-500">Privacy Policy</button>
            </span>
          </label>
          <p v-if="registerErrors.agreeTerms" class="text-sm text-rose-500">{{ registerErrors.agreeTerms }}</p>

          <button
            type="submit"
            class="flex h-13 w-full items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:bg-sky-500 disabled:opacity-60"
            :disabled="isLoading"
          >
            <span v-if="!isLoading">Register</span>
            <span v-else class="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
          </button>
        </form>

        <div class="mt-6 rounded-[24px] border border-sky-100 bg-sky-50/80 px-4 py-4 text-sm text-slate-500">
          <span>{{ isLoginMode ? "No account yet?" : "Already have an account?" }}</span>
          <button type="button" class="ml-2 font-semibold text-sky-500 transition hover:text-sky-400" @click="toggleMode">
            {{ isLoginMode ? "Register now" : "Login now" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
