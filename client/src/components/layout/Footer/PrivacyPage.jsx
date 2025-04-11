import React from 'react';
import { Link } from 'react-router-dom';

 
 const PrivacyPage = () => {
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
            <h1 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-4">Privacy Policy</h1>
            
            <div className="prose max-w-none">
              <h2 className="text-2xl font-semibold text-gray-700 mt-6 mb-3">1. Information We Collect</h2>
              <p className="mb-4">
                We collect information you provide directly to us when you create an account, participate in quizzes, 
                or communicate with us. This may include your name, email address, and quiz responses.
              </p>
              
              <h2 className="text-2xl font-semibold text-gray-700 mt-6 mb-3">2. How We Use Your Information</h2>
              <p className="mb-4">
                We use the information we collect to provide, maintain, and improve our services, to communicate 
                with you, and to personalize your experience on the Quiz Portal.
              </p>
              
              <h2 className="text-2xl font-semibold text-gray-700 mt-6 mb-3">3. Information Sharing</h2>
              <p className="mb-4">
                We do not share your personal information with third parties except as described in this policy. 
                We may share information with service providers who perform services on our behalf or when required by law.
              </p>
              
              <h2 className="text-2xl font-semibold text-gray-700 mt-6 mb-3">4. Data Security</h2>
              <p className="mb-4">
                We take reasonable measures to help protect your personal information from loss, theft, misuse, 
                unauthorized access, disclosure, alteration, and destruction.
              </p>
              
              <h2 className="text-2xl font-semibold text-gray-700 mt-6 mb-3">5. Cookies and Tracking Technologies</h2>
              <p className="mb-4">
                We use cookies and similar tracking technologies to track activity on our platform and to enhance 
                your experience. You can control cookies through your browser settings.
              </p>
              
              <h2 className="text-2xl font-semibold text-gray-700 mt-6 mb-3">6. Your Rights</h2>
              <p className="mb-4">
                You may access, update, or delete your personal information by contacting us. Note that we may 
                retain certain information as required by law or for legitimate business purposes.
              </p>
              
              <h2 className="text-2xl font-semibold text-gray-700 mt-6 mb-3">7. Changes to This Policy</h2>
              <p className="mb-4">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting 
                the new policy on this page.
              </p>
              
              <h2 className="text-2xl font-semibold text-gray-700 mt-6 mb-3">8. Contact Us</h2>
              <p className="mb-4">
                If you have any questions about this Privacy Policy, please contact us through our Contact page.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  export default PrivacyPage;
