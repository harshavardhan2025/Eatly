import React from "react";
import "./Footer.css";

const Footer = () => {
  return (
    <footer className="footer-container">
      <div className="footer-content">
        <p className="footer-copyright">
          © {new Date().getFullYear()} All copyrights reserved. Made with <span className="heart">❤️</span> by Eatly
        </p>
      </div>
    </footer>
  );
};

export default Footer;
