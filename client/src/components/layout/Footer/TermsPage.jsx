import React from 'react';
import { Link } from 'react-router-dom';

// Terms of Service Page
 const TermsPage = () => {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center">
        <Link 
              to="/" 
              className="flex items-center bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors duration-300"
            >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
            </svg>
            Back to Home
          </Link>
        </div>
        
        <div className="bg-white shadow-lg rounded-lg p-6 md:p-10">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-4">Terms of Service</h1>
          
          <div className="prose max-w-none">
            <h2 className="text-2xl font-semibold text-gray-700 mt-6 mb-3">1. Acceptance of Terms</h2>
            <p className="mb-4">
              By accessing or using the Quiz Portal platform, you agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use our service.
            </p>
            
            <h2 className="text-2xl font-semibold text-gray-700 mt-6 mb-3">2. User Accounts</h2>
            <p className="mb-4">
              To access certain features of our platform, you may be required to register for an account. 
              You are responsible for maintaining the confidentiality of your account information and for 
              all activities that occur under your account.
            </p>
            
            <h2 className="text-2xl font-semibold text-gray-700 mt-6 mb-3">3. Content and Conduct</h2>
            <p className="mb-4">
              Users are responsible for all content they submit, post, or display on the Quiz Portal. 
              Prohibited content includes but is not limited to: offensive material, copyrighted content 
              without permission, and any illegal content.
            </p>
            
            <h2 className="text-2xl font-semibold text-gray-700 mt-6 mb-3">4. Intellectual Property</h2>
            <p className="mb-4">
              All content, features, and functionality on the Quiz Portal are owned by us or our licensors 
              and are protected by copyright, trademark, and other intellectual property laws.
            </p>
            
            <h2 className="text-2xl font-semibold text-gray-700 mt-6 mb-3">5. Termination</h2>
            <p className="mb-4">
              We reserve the right to terminate or suspend your account and access to our services at our 
              sole discretion, without notice, for conduct that we believe violates these Terms of Service.
            </p>
            
            <h2 className="text-2xl font-semibold text-gray-700 mt-6 mb-3">6. Changes to Terms</h2>
            <p className="mb-4">
              We may revise these Terms of Service at any time by updating this page. By continuing to use 
              the Quiz Portal after such changes, you agree to the revised terms.
            </p>
            
            <h2 className="text-2xl font-semibold text-gray-700 mt-6 mb-3">7. Contact Us</h2>
            <p className="mb-4">
              If you have any questions about these Terms of Service, please contact us through our Contact page.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
