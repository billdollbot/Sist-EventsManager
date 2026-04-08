import { CheckCircle, X, Info } from "lucide-react";

export default function ToastStack({ toasts }) {
  return (
    <div className="toast-stack">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          {t.type === "success" && <CheckCircle size={15} />}
          {t.type === "error"   && <X size={15} />}
          {t.type === "info"    && <Info size={15} />}
          {t.msg}
        </div>
      ))}
    </div>
  );
}
