import React from 'react';

import { Github, Twitter, Linkedin, Mail, ClipboardList } from 'lucide-react';


const Footer = () => {

  const socialLinks = [

    { href: "https://github.com/saishghatol", label: "GitHub", icon: Github },

    { href: "https://twitter.com/saishghatol", label: "Twitter", icon: Twitter },

    { href: "https://linkedin.com/in/saish-ghatol", label: "LinkedIn", icon: Linkedin },

    { href: "mailto:saishghatol100@gmail.com", label: "Email", icon: Mail },

  ];


  const quickLinks = [

    { href: "/quizzes", text: "Quizzes" },

    { href: "/my-attempts", text: "My Attempts" },

    { href: "/terms", text: "Terms of Service" },

    { href: "/privacy", text: "Privacy Policy" },

    { href: "/contact", text: "Contact" },

  ];


  return (

    <footer className="bg-black border-t border-gray-900 text-gray-400">

      <div className="container mx-auto px-6 py-16">

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">

          {/* Brand & Socials */}

          <div className="lg:col-span-1">

            <div className="flex items-center gap-3 mb-6">

              <div className="w-10 h-10 bg-gray-900 border border-gray-800 rounded-lg flex items-center justify-center">

                <ClipboardList className="w-6 h-6 text-white" />

              </div>

              <span className="font-bold text-2xl text-white">Quiz Portal</span>

            </div>

            <p className="text-sm leading-relaxed mb-6">

              A minimalist, high-performance platform for focused learning and measurable progress.

            </p>

            <div className="flex gap-3">

              {socialLinks.map(link => (

                <a

                  key={link.label}

                  href={link.href}

                  target="_blank"

                  rel="noopener noreferrer"

                  className="w-10 h-10 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-lg flex items-center justify-center transition-colors duration-300 group"

                  aria-label={link.label}

                >

                  <link.icon className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />

                </a>

              ))}

            </div>

          </div>


          {/* Quick Links */}

          <div>

            <h3 className="text-lg font-semibold text-white mb-6">Quick Links</h3>

            <ul className="space-y-3">

              {quickLinks.map(link => (

                <li key={link.text}>

                  <a href={link.href} className="hover:text-white transition-colors duration-300 text-sm">

                    {link.text}

                  </a>

                </li>

              ))}

            </ul>

          </div>


          {/* Contact Information */}

          <div>

            <h3 className="text-lg font-semibold text-white mb-6">Contact</h3>

            <ul className="space-y-3">

              <li>

                <a href="mailto:saishghatol100@gmail.com" className="hover:text-white transition-colors duration-300 text-sm">

                  saishghatol100@gmail.com

                </a>

              </li>

              <li>

                <a href="tel:+919876543210" className="hover:text-white transition-colors duration-300 text-sm">

                  +91 98765 43210

                </a>

              </li>

              <li className="text-sm">

                ABC, XYZ — India

              </li>

            </ul>

          </div>


          {/* Developer Info */}

          <div>

            <h3 className="text-lg font-semibold text-white mb-6">Developer</h3>

            <div className="text-sm bg-gray-900/50 border border-gray-800 rounded-xl p-4">

              <p className="mb-1 text-gray-500">Crafted by</p>

              <a

                href="https://linkedin.com/in/saish-ghatol"

                target="_blank"

                rel="noopener noreferrer"

                className="font-semibold text-white hover:text-gray-300 transition-colors"

              >

                Saish Ghatol

              </a>

            </div>

          </div>

        </div>

      </div>


      {/* Footer Bottom */}

      <div className="border-t border-gray-900">

        <div className="container mx-auto px-6 py-6">

          <div className="text-center text-sm text-gray-500">

            © {new Date().getFullYear()} Quiz Portal. All rights reserved.

          </div>

        </div>

      </div>

    </footer>

  );

};


export default Footer; 