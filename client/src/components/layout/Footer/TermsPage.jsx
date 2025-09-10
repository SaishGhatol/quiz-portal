import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';

const TermsPage = () => {
  const termsSections = [
    {
      title: "1. Acceptance of Terms",
      content: "By accessing or using the Quiz Portal platform ('Service'), you agree to be bound by these Terms of Service. If you disagree with any part of the terms, then you may not access the Service."
    },
    {
      title: "2. User Accounts",
      content: "To access certain features of our platform, you may be required to register for an account. You are responsible for safeguarding your account information and for all activities that occur under your account. You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account."
    },
    {
      title: "3. Content and Conduct",
      content: "You are responsible for all content you submit, post, or display on the Quiz Portal. You agree not to post content that is illegal, offensive, or infringing on intellectual property rights. We reserve the right to remove any content that violates these terms."
    },
    {
      title: "4. Intellectual Property",
      content: "The Service and its original content, features, and functionality are and will remain the exclusive property of the Quiz Portal and its licensors. Our trademarks may not be used in connection with any product or service without our prior written consent."
    },
    {
      title: "5. Termination",
      content: "We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms."
    },
    {
      title: "6. Changes to Terms",
      content: "We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will provide at least 30 days' notice prior to any new terms taking effect. By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms."
    },
    {
      title: "7. Contact Us",
      content: "If you have any questions about these Terms of Service, please contact us through our official contact channels."
    }
  ];

  return (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.5s ease-out forwards; }
      `}</style>
      <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
        <header className="mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={16} />
            Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-white mt-2 flex items-center gap-3">
            <FileText size={32} />
            Terms of Service
          </h1>
          <p className="text-gray-500 mt-1">Last Updated: September 3, 2025</p>
        </header>

        <div className="bg-gray-950 border border-gray-800 rounded-2xl p-6 md:p-8">
          <div className="space-y-8">
            <p className="text-lg text-gray-300">
              Please read these Terms of Service carefully before using our platform. Your access to and use of the Service is conditioned on your acceptance of and compliance with these Terms.
            </p>
            {termsSections.map((section, index) => (
              <div key={index}>
                <h2 className="text-2xl font-semibold text-white border-b border-gray-800 pb-3 mb-4">
                  {section.title}
                </h2>
                <p className="text-gray-400 leading-relaxed">
                  {section.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default TermsPage;
