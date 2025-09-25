import { useEffect } from "react";
import "./modal.css";

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = "md",
  closeOnOverlay = true,
  closeOnEsc = true,
}) {
  useEffect(() => {
    function onEsc(e) {
      if (!closeOnEsc) return;
      if (e.key === "Escape") onClose?.();
    }
    if (isOpen) document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [isOpen, onClose, closeOnEsc]);

  useEffect(() => {
    // Prevent background scroll while modal is open
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => (document.body.style.overflow = "");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-portal" role="dialog" aria-modal="true">
      <div
        className="modal-overlay"
        style={{ pointerEvents: closeOnOverlay ? 'auto' : 'none' }}
        onClick={() => (closeOnOverlay ? onClose?.() : null)}
      />
      <div className={`modal ${size}`} onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" aria-label="Close" onClick={onClose}>
            <span aria-hidden>×</span>
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
