export type ToastType = "success" | "error" | "warning" | "info";

export type ToastInput = {
  title: string;
  message: string;
  type: ToastType;
  duration?: number;
};

export type ToastRecord = ToastInput & {
  id: string;
  createdAt: number;
};

type ToastListener = (toasts: ToastRecord[]) => void;

const durations: Record<ToastType, number> = {
  success: 4000,
  error: 7000,
  warning: 5500,
  info: 4000
};

let toasts: ToastRecord[] = [];
const listeners = new Set<ToastListener>();

const emit = () => {
  for (const listener of listeners) listener([...toasts]);
};

const makeId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `toast_${Math.random().toString(36).slice(2, 11)}`;

const remove = (id: string) => {
  toasts = toasts.filter((toast) => toast.id !== id);
  emit();
};

export const toastService = {
  subscribe(listener: ToastListener) {
    listeners.add(listener);
    listener([...toasts]);
    return () => listeners.delete(listener);
  },
  add(input: ToastInput) {
    const record: ToastRecord = {
      ...input,
      duration: input.duration ?? durations[input.type],
      id: makeId(),
      createdAt: Date.now()
    };

    toasts = [...toasts, record].slice(-4);
    emit();
    const timeout = window.setTimeout(() => remove(record.id), record.duration);
    return () => window.clearTimeout(timeout);
  },
  success(title: string, message: string, duration?: number) {
    return toastService.add({ type: "success", title, message, duration });
  },
  error(title: string, message: string, duration?: number) {
    return toastService.add({ type: "error", title, message, duration });
  },
  warning(title: string, message: string, duration?: number) {
    return toastService.add({ type: "warning", title, message, duration });
  },
  info(title: string, message: string, duration?: number) {
    return toastService.add({ type: "info", title, message, duration });
  },
  dismiss(id: string) {
    remove(id);
  },
  clear() {
    toasts = [];
    emit();
  }
};

export const toastDurations = durations;
