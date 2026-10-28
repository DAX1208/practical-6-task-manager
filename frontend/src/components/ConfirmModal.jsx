import React, { useEffect } from "react";

function ConfirmModal({ isOpen, title, message, confirmText = "Delete", onConfirm, onCancel, danger = true }) {
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape" && isOpen) {
                onCancel();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onCancel]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onCancel} role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title">
            <div className="modal-card confirm-modal-card" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="modal-header-icon danger">
                        ⚠️
                    </div>
                    <div>
                        <h3 id="confirm-modal-title" className="modal-title">{title}</h3>
                        <p className="modal-subtitle">{message}</p>
                    </div>
                </div>

                <div className="modal-actions">
                    <button type="button" className="secondary-button" onClick={onCancel}>
                        Cancel
                    </button>
                    <button
                        type="button"
                        className={danger ? "danger-button" : "primary-button"}
                        onClick={onConfirm}
                        autoFocus
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default React.memo(ConfirmModal);
