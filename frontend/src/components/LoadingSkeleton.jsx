import React from "react";

function LoadingSkeleton({ count = 3, label = "Loading content..." }) {
    return (
        <div className="skeleton-container" aria-busy="true" aria-label={label}>
            {Array.from({ length: count }).map((_, index) => (
                <div className="skeleton-card" key={index}>
                    <div className="skeleton-line skeleton-title"></div>
                    <div className="skeleton-line skeleton-desc"></div>
                    <div className="skeleton-line skeleton-badge"></div>
                </div>
            ))}
        </div>
    );
}

export default React.memo(LoadingSkeleton);
