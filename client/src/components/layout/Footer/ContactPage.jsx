import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeft, Mail, Phone, MapPin, Send, Loader } from 'lucide-react';

const ContactPage = () => {
    const [formStatus, setFormStatus] = useState('');
    const [loading, setLoading] = useState(false);
    
    const handleSubmit = (e) => {
      e.preventDefault();
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        setLoading(false);
        toast.success('Your message has been sent. We will get back to you soon!', { theme: 'dark' });
        e.target.reset();
      }, 1500);
    };
    
    return (
      <>
        <style>{`
            @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            .animate-fade-in { animation: fadeIn 0.5s ease-out forwards; }
        `}</style>
        <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in">
          <header className="mb-8">
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
              <ArrowLeft size={16} />
              Back to Home
            </Link>
            <h1 className="text-4xl font-bold text-white mt-2 flex items-center gap-3">
              Contact Us
            </h1>
            <p className="text-gray-400 mt-1">We're here to help. Send us a message and we'll get back to you.</p>
          </header>

          <div className="bg-gray-950 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="grid md:grid-cols-2">
              {/* Left Side: Info */}
              <div className="p-8 md:p-10 bg-gray-900/50">
                <h2 className="text-2xl font-semibold text-white mb-6">Get in Touch</h2>
                <p className="text-gray-400 mb-8 leading-relaxed">
                  Have a question, feedback, or need support? Fill out the form or use the contact details below. Our team is ready to assist you.
                </p>
                
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <Mail size={20} className="text-gray-500 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-white">Email</h3>
                      <a href="mailto:saishghatol100@gmail.com" className="text-gray-400 hover:text-white transition-colors">saishghatol100@gmail.com</a>
                    </div>
                  </div>
                   <div className="flex items-start gap-4">
                    <Phone size={20} className="text-gray-500 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-white">Phone</h3>
                      <a href="tel:+911234567890" className="text-gray-400 hover:text-white transition-colors">+(91) 123-4567</a>
                    </div>
                  </div>
                   <div className="flex items-start gap-4">
                    <MapPin size={20} className="text-gray-500 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-white">Office</h3>
                      <p className="text-gray-400">123 Quiz Street, Knowledge City, India</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Right Side: Form */}
              <div className="p-8 md:p-10">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="relative">
                    <input type="text" id="name" required className="peer w-full px-4 py-3 bg-transparent border border-gray-700 rounded-lg placeholder-transparent focus:outline-none focus:ring-1 focus:ring-gray-500" placeholder="Full Name" />
                    <label htmlFor="name" className="absolute left-4 -top-2.5 text-xs text-gray-400 bg-gray-950 px-1 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-3.5 peer-focus:-top-2.5 peer-focus:text-xs">Full Name</label>
                  </div>
                  
                   <div className="relative">
                    <input type="email" id="email" required className="peer w-full px-4 py-3 bg-transparent border border-gray-700 rounded-lg placeholder-transparent" placeholder="Email Address" />
                    <label htmlFor="email" className="absolute left-4 -top-2.5 text-xs text-gray-400 bg-gray-950 px-1 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-3.5 peer-focus:-top-2.5 peer-focus:text-xs">Email Address</label>
                  </div>

                   <div className="relative">
                    <input type="text" id="subject" required className="peer w-full px-4 py-3 bg-transparent border border-gray-700 rounded-lg placeholder-transparent" placeholder="Subject" />
                    <label htmlFor="subject" className="absolute left-4 -top-2.5 text-xs text-gray-400 bg-gray-950 px-1 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-3.5 peer-focus:-top-2.5 peer-focus:text-xs">Subject</label>
                  </div>
                  
                  <div className="relative">
                    <textarea id="message" rows="4" required className="peer w-full px-4 py-3 bg-transparent border border-gray-700 rounded-lg placeholder-transparent" placeholder="Your Message"></textarea>
                    <label htmlFor="message" className="absolute left-4 -top-2.5 text-xs text-gray-400 bg-gray-950 px-1 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-3.5 peer-focus:-top-2.5 peer-focus:text-xs">Your Message</label>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center items-center py-3 px-4 text-sm font-semibold rounded-lg text-black bg-white hover:bg-gray-200 transition disabled:opacity-50"
                  >
                    {loading ? (
                        <><Loader className="animate-spin h-5 w-5 mr-2" /> Sending...</>
                    ) : (
                        <><Send className="h-5 w-5 mr-2" /> Send Message</>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
    </>
    );
  };
  
  export default ContactPage;
