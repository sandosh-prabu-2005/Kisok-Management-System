import React from "react";

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-3 m-3 mt-5">
      <div className="container text-center">
        <p className="mb-0">
          &copy; {currentYear} Canteen Management System. All rights reserved.
        </p>
        <p className="mb-0">
          Developed with <i className="fas fa-heart text-danger"></i> by{" "}
          <a
            className="text-decoration-none"
            href="https://github.com/sandosh-prabu-2005"
          >
            Sandosh Prabu</a>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
