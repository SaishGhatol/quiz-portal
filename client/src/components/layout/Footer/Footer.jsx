import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-2">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-6 md:mb-0">
            <div className="font-bold text-xl mb-2">Quiz Portal</div>
            <p className="text-center md:text-left text-gray-300">&copy; {new Date().getFullYear()} Quiz Portal. All rights reserved.</p>
          </div>

          <div className="mb-4 md:mb-0 text-sm text-gray-400">
              Made with ❤️ for knowledge seekers by  <Link to="https://linkedin.com/in/saish-ghatol" className="hover:text-blue-300 transition duration-300 ease-in-out transform hover:scale-105 text-md font-bold text-white">SaishGhatol</Link>
            </div>
          
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-8">
            <Link to="/terms" className="hover:text-blue-300 transition duration-300 ease-in-out transform hover:scale-105">
              Terms of Service
            </Link>
            <Link to="/privacy" className="hover:text-blue-300 transition duration-300 ease-in-out transform hover:scale-105">
              Privacy Policy
            </Link>
            <Link to="/contact" className="hover:text-blue-300 transition duration-300 ease-in-out transform hover:scale-105">
              Contact Us
            </Link>
          </div>
        </div>
            </div>
    </footer>
  );
};

export default Footer;