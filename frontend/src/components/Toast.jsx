import React from "react";

function Toast({ message, error }) {
    if (!message && !error) return null;

    return (
        <div 
            className={`toast ${error ? "error" : "success"}`}
            role={error ? "alert" : "status"}
            aria-live="polite"
        >
            {error || message}
        </div>
    );
}

export default React.memo(Toast);
