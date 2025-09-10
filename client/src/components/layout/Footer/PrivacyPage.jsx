import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

const PrivacyPage = () => {
  const policySections = [
    {
      title: "1. Information We Collect",
      content: "We collect information you provide directly to us when you create an account, participate in quizzes, or communicate with us. This may include your name, email address, and quiz responses."
    },
    {
      title: "2. How We Use Your Information",
      content: "We use the information we collect to operate, maintain, and improve our services, including personalizing your experience, providing analytics, and communicating with you about your account and our services."
    },
    {
      title: "3. Information Sharing",
      content: "We do not sell your personal information. We may share information with service providers who perform services on our behalf, with your consent, or when required by law to protect the rights, property, or safety of our users or others."
    },
    {
      title: "4. Data Security",
      content: "We implement a variety of security measures to maintain the safety of your personal information. However, no method of transmission over the Internet or method of electronic storage is 100% secure."
    },
    {
      title: "5. Cookies and Tracking Technologies",
      content: "We use cookies and similar tracking technologies to track activity on our platform and hold certain information. This helps us to improve your experience and analyze our traffic."
    },
    {
      title: "6. Your Rights & Choices",
      content: "You have the right to access, update, or delete the information we have on you. You can do this at any time by accessing your account settings or contacting us for support."
    },
    {
      title: "7. Changes to This Policy",
      content: "We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the 'Last Updated' date at the top."
    },
    {
      title: "8. Contact Us",
      content: "If you have any questions about this Privacy Policy, please contact us through our official contact channels."
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
            <Shield size={32} />
            Privacy Policy
          </h1>
          <p className="text-gray-500 mt-1">Last Updated: September 3, 2025</p>
        </header>

        <div className="bg-gray-950 border border-gray-800 rounded-2xl p-6 md:p-8">
          <div className="space-y-8">
            <p className="text-lg text-gray-300">
              Welcome to the Quiz Portal. We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about our policy, or our practices with regards to your personal information, please contact us.
            </p>
            {policySections.map((section, index) => (
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

export default PrivacyPage;
