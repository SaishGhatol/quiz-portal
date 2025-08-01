import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-gradient-to-r from-blue-900 to-purple-900 text-white py-10 mt-16 shadow-inner">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-10">
          {/* Brand & About */}
          <div className="mb-8 md:mb-0 flex-1 flex flex-col items-center md:items-start">
            <div className="font-extrabold text-3xl mb-2 text-center md:text-left tracking-wider drop-shadow-lg">Quiz Portal</div>
            <p className="text-center md:text-left text-blue-200 text-base font-medium mb-2">
              &copy; {new Date().getFullYear()} Quiz Portal. All rights reserved.
            </p>
            <p className="text-center md:text-left text-gray-200 text-md italic max-w-md">
              Quiz Portal is a modern platform for learning, testing, and improving your knowledge across various topics. Join, challenge yourself, and grow!
            </p>
          </div>

          {/* Creator & Socials */}
          <div className="mb-8 md:mb-0 flex-1 flex flex-col items-center md:items-start text-base text-gray-200">
            <span className="block mb-2 text-center md:text-left">
              Made with <span className="text-red-400">❤️</span> for knowledge seekers by
              <a
                href="https://linkedin.com/in/saish-ghatol"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-300 transition duration-300 ease-in-out transform hover:scale-105 text-md font-bold text-white ml-1"
              >
                Saish Ghatol
              </a>
            </span>
            <div className="flex items-center justify-center md:justify-start gap-6 mt-2">
              <a
                href="https://github.com/saishghatol"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-100"
                aria-label="GitHub"
              >
                <svg className="w-6 h-6 inline" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.477 2 2 6.484 2 12.012c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.483 0-.237-.009-.868-.013-1.703-2.782.605-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.004.07 1.532 1.032 1.532 1.032.892 1.529 2.341 1.088 2.91.832.091-.646.35-1.088.636-1.34-2.221-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.338 1.909-1.295 2.747-1.025 2.747-1.025.546 1.378.202 2.397.099 2.65.64.7 1.028 1.595 1.028 2.688 0 3.847-2.337 4.695-4.566 4.944.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.579.688.481C19.138 20.175 22 16.427 22 12.012 22 6.484 17.523 2 12 2z"/>
                </svg>
              </a>
              <a
                href="mailto:saishghatol100@gmail.com"
                className="hover:text-gray-100"
                aria-label="Email"
              >
                <svg className="w-6 h-6 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
              </a>
              <a
                href="https://twitter.com/saishghatol"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-400"
                aria-label="Twitter"
              >
                <svg className="w-6 h-6 inline" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23 3a10.9 10.9 0 01-3.14 1.53A4.48 4.48 0 0022.4.36a9.09 9.09 0 01-2.88 1.1A4.52 4.52 0 0016.11 0c-2.53 0-4.59 2.06-4.59 4.59 0 .36.04.71.11 1.05A12.94 12.94 0 013 1.13a4.52 4.52 0 001.4 6.06A4.48 4.48 0 012.8 6.7v.06c0 2.22 1.58 4.07 3.7 4.49a4.52 4.52 0 01-2.07.08c.58 1.81 2.26 3.13 4.25 3.17A9.06 9.06 0 012 19.54a12.8 12.8 0 006.95 2.03c8.34 0 12.9-6.91 12.9-12.9 0-.2 0-.39-.01-.58A9.22 9.22 0 0023 3z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Footer Links */}
          <div className="flex-1 flex flex-col items-center md:items-end text-center">
            <div className="text-lg font-semibold mb-3 text-purple-200 ">Quick Links</div>
            <div className="flex flex-wrap justify-center md:justify-end gap-4">
              <Link to="/terms" className="hover:text-blue-300 transition duration-300 ease-in-out transform hover:scale-105 px-3 py-1 rounded bg-blue-950 bg-opacity-40">
                Terms of Service
              </Link>
              <Link to="/privacy" className="hover:text-blue-300 transition duration-300 ease-in-out transform hover:scale-105 px-3 py-1 rounded bg-blue-950 bg-opacity-40">
                Privacy Policy
              </Link>
              <Link to="/contact" className="hover:text-blue-300 transition duration-300 ease-in-out transform hover:scale-105 px-3 py-1 rounded bg-blue-950 bg-opacity-40">
                Contact Us
              </Link>
              <Link to="/faq" className="hover:text-blue-300 transition duration-300 ease-in-out transform hover:scale-105 px-3 py-1 rounded bg-blue-950 bg-opacity-40">
                FAQ
              </Link>
              <Link to="/about" className="hover:text-blue-300 transition duration-300 ease-in-out transform hover:scale-105 px-3 py-1 rounded bg-blue-950 bg-opacity-40">
                About Us
              </Link>
              <a
                href="https://github.com/saishghatol/quiz-portal"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-300 transition duration-300 ease-in-out transform hover:scale-105 px-3 py-1 rounded bg-blue-950 bg-opacity-40"
              >
                GitHub Repo
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;