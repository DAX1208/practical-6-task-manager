import React from "react";

function Header() {
    return (
        <header className="header" role="banner">
            <h1>Task Manager</h1>
            <p>React + Node.js + MongoDB</p>
        </header>
    );
}

export default React.memo(Header);
