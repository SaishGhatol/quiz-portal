import React from 'react';
import { Github, Twitter, Linkedin, Mail, MapPin, Phone, Clock, ExternalLink, ClipboardList } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 text-white">
      {/* Main Footer Content */}
      <div className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          
          {/* Brand & Description */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center hover:scale-105 transition-transform duration-200">
               <ClipboardList className="w-6 h-6 text-white" />
              </div>

              <div className="font-bold text-2xl bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Quiz Portal
              </div>
            </div>
            
            <p className="text-slate-300 text-sm leading-relaxed mb-6">
              Bringing the authentic experience of knowledge testing and learning to students everywhere. 
              Crafted with care, served with passion since 2024.
            </p>
            
            {/* Social Media Icons */}
            <div className="flex gap-4">
              <a
                href="https://github.com/saishghatol"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center transition-colors duration-300 group"
                aria-label="GitHub"
              >
                <Github className="w-5 h-5 text-slate-400 group-hover:text-white" />
              </a>
              <a
                href="https://twitter.com/saishghatol"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-slate-800 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-colors duration-300 group"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5 text-slate-400 group-hover:text-white" />
              </a>
              <a
                href="https://linkedin.com/in/saish-ghatol"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-slate-800 hover:bg-blue-700 rounded-lg flex items-center justify-center transition-colors duration-300 group"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5 text-slate-400 group-hover:text-white" />
              </a>
              <a
                href="mailto:saishghatol100@gmail.com"
                className="w-10 h-10 bg-slate-800 hover:bg-red-600 rounded-lg flex items-center justify-center transition-colors duration-300 group"
                aria-label="Email"
              >
                <Mail className="w-5 h-5 text-slate-400 group-hover:text-white" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-6 relative">
              Quick Links
              <div className="w-12 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400 mt-2"></div>
            </h3>
            <ul className="space-y-3">
              {['Home', 'About Us', 'Quiz Categories', 'FAQ', 'Contact'].map((item, index) => (
                <li key={item}>
                  <a
                    href={`/${item.toLowerCase().replace(' ', '-')}`}
                    className="text-slate-300 hover:text-white transition-colors duration-300 text-sm flex items-center gap-2 group"
                  >
                    <div className="w-1 h-1 bg-slate-500 rounded-full group-hover:bg-blue-400 transition-colors duration-300"></div>
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

    {/* Contact Information */}
<div>
  <h3 className="text-lg font-semibold text-white mb-6 relative">
    Contact Us
    <div className="w-12 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400 mt-2"></div>
  </h3>

  <div className="space-y-4">
    <div className="flex items-start gap-3">
      <MapPin className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
      <div className="text-sm text-slate-300">
        <div>ABC, XYZ India</div>
        <div>Digital Learning Hub</div>
      </div>
    </div>

    <div className="flex items-center gap-3">
      <a
        href="tel:+919876543210"
        aria-label="Call +91 98765 43210"
        className="flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"
      >
        <Phone className="w-5 h-5 text-blue-400 flex-shrink-0" />
        <span className="text-sm text-slate-300">+91 98765 43210</span>
      </a>
    </div>

    <div className="flex items-center gap-3">
      <a
        href="mailto:saishghatol100@gmail.com"
        aria-label="Email saishghatol100 at gmail dot com"
        className="flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"
      >
        <Mail className="w-5 h-5 text-blue-400 flex-shrink-0" />
        <span className="text-sm text-slate-300">saishghatol100@gmail.com</span>
      </a>
    </div>
  </div>
</div>

          {/* Developer Info & Status */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-6 relative">
              Developer Info
              <div className="w-12 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400 mt-2"></div>
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-slate-300">We're Online</span>
              </div>
              
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                <div className="text-sm text-slate-300 mb-2">Made with ❤️ by</div>
                <a
                  href="https://linkedin.com/in/saish-ghatol"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-blue-400 hover:text-blue-300 transition-colors duration-300 flex items-center gap-1"
                >
                  Saish Ghatol
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              
              <div className="text-xs text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>Built with:</span>
                  <span className="text-slate-300">React & Tailwind</span>
                </div>
                <div className="flex justify-between">
                  <span>Last updated:</span>
                  <span className="text-slate-300">{new Date().toLocaleDateString()}</span>
                </div>
              </div>
              
              <a
                href="https://github.com/saishghatol/quiz-portal"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors duration-300 bg-slate-800/30 px-3 py-2 rounded-lg border border-slate-700/50 hover:border-purple-500/50 w-full justify-center"
              >
                <Github className="w-4 h-4" />
                View Source Code
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="border-t border-slate-700/50 bg-slate-900/50">
        <div className="container mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-slate-400">
              © 2025 Quiz Portal. All rights reserved.
            </div>
            
            <div className="flex gap-6 text-sm">
              <a href="/privacy" className="text-slate-400 hover:text-white transition-colors duration-300">
                Privacy Policy
              </a>
              <a href="/terms" className="text-slate-400 hover:text-white transition-colors duration-300">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;