import { reactive, readonly } from "vue";

const state = reactive({
  visible: false,
  title: "",
  message: "",
  confirmText: "Confirm",
  cancelText: "Cancel",
  variant: "default",
  resolver: null,
});

export const useConfirmDialog = () => {
  const openConfirm = ({
    title = "Please confirm",
    message = "",
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = "default",
  } = {}) =>
    new Promise((resolve) => {
      state.visible = true;
      state.title = title;
      state.message = message;
      state.confirmText = confirmText;
      state.cancelText = cancelText;
      state.variant = variant;
      state.resolver = resolve;
    });

  const closeConfirm = (confirmed) => {
    if (typeof state.resolver === "function") {
      state.resolver(confirmed);
    }
    state.visible = false;
    state.title = "";
    state.message = "";
    state.confirmText = "Confirm";
    state.cancelText = "Cancel";
    state.variant = "default";
    state.resolver = null;
  };

  return {
    confirmState: readonly(state),
    openConfirm,
    closeConfirm,
  };
};
