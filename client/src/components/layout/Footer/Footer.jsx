import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-gradient-to-tr from-gray-900 via-gray-800 to-gray-900 text-gray-300 py-10 border-t border-gray-700">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
          
          {/* Logo & Copyright */}
          <div>
            <h2 className="text-2xl font-extrabold text-white mb-3">Quiz Portal</h2>
            <p className="text-sm text-gray-400">&copy; {new Date().getFullYear()} Quiz Portal. All rights reserved.</p>
          </div>
          
          {/* Developer Credit */}
          <div>
            <p className="text-sm">
              Made with <span className="text-red-500">❤️</span> by
              <Link
                to="https://linkedin.com/in/saish-ghatol"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline ml-1"
              >
                Saish Ghatol
              </Link>
            </p>
            <p className="text-xs mt-1 text-gray-500">for all passionate learners ✨</p>
          </div>
          
          {/* Links */}
          <div className="flex flex-col space-y-2 md:items-end">
            <Link to="/terms" className="hover:text-white hover:underline transition duration-300">
              Terms of Service
            </Link>
            <Link to="/privacy" className="hover:text-white hover:underline transition duration-300">
              Privacy Policy
            </Link>
            <Link to="/contact" className="hover:text-white hover:underline transition duration-300">
              Contact Us
            </Link>
          </div>

        </div>
      </div>
    </footer>
  );
};

export default Footer;
