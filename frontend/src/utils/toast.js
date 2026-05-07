import { useToast } from "vue-toastification";

let toastInstance;

const getToast = () => {
  if (!toastInstance) {
    toastInstance = useToast();
  }
  return toastInstance;
};

export const notify = {
  success(message) {
    getToast().success(message);
  },
  error(message) {
    getToast().error(message);
  },
  info(message) {
    getToast().info(message);
  },
  warning(message) {
    getToast().warning(message);
  },
};
