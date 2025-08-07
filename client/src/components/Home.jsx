import React, { useContext, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../contexts/AuthContext';
import { ThemeContext } from './layout/theme';
import { 
  ArrowRight, 
  BookOpen, 
  Trophy, 
  Settings, 
  Users, 
  Brain, 
  Target,
  Star,
  TrendingUp,
  Shield,
  Zap,
  Play
} from 'lucide-react';
import api from '../utils/api';

const Home = () => {
  const { currentUser, isAdmin } = useContext(AuthContext);
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    totalUsers: 0,
    totalAttempts: 0
  });
  const [loading, setLoading] = useState(true);
  const { isDay } = useContext(ThemeContext);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch basic stats that don't require authentication
        const quizzesResponse = await api.get('/quizzes');
        setStats({
          totalQuizzes: quizzesResponse.data.quizzes?.length || 150,
          totalUsers: 12500,
          totalAttempts: 45000
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
        // Fallback stats
        setStats({
          totalQuizzes: 150,
          totalUsers: 12500,
          totalAttempts: 45000
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const navigationCards = [
    {
      title: "Start Quiz",
      description: "Explore our collection of interactive quizzes across various topics and start learning today",
      icon: Play,
      link: "/quizzes",
      linkText: "Explore Quizzes",
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
      gradient: "bg-gradient-to-br from-blue-50 to-cyan-50"
    },
    {
      title: "Leaderboard",
      description: "See how you rank against other quiz takers and track your progress on the leaderboard",
      icon: Trophy,
      link: currentUser ? "/my-attempts" : "/login",
      linkText: currentUser ? "View Leaderboard" : "Login to View",
      color: "from-amber-500 to-orange-500",
      bgColor: "bg-amber-50",
      iconColor: "text-amber-600",
      gradient: "bg-gradient-to-br from-amber-50 to-orange-50"
    },
    {
      title: "Profile",
      description: "Manage your account, view achievements, and track your complete learning journey",
      icon: Users,
      link: currentUser ? "/profile" : "/register",
      linkText: currentUser ? "View Profile" : "Create Account",
      color: "from-emerald-500 to-green-500",
      bgColor: "bg-emerald-50",
      iconColor: "text-emerald-600",
      gradient: "bg-gradient-to-br from-emerald-50 to-green-50"
    }
  ];

  if (isAdmin) {
    navigationCards.push({
      title: "Admin Panel",
      description: "Manage quizzes, users, and monitor comprehensive platform statistics",
      icon: Settings,
      link: "/admin",
      linkText: "Admin Dashboard",
      color: "from-purple-500 to-indigo-500",
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600",
      gradient: "bg-gradient-to-br from-purple-50 to-indigo-50"
    });
  }

  const features = [
    {
      icon: Brain,
      title: "Smart Learning",
      description: "AI-powered questions that adapt to your learning pace and style"
    },
    {
      icon: Target,
      title: "Targeted Practice",
      description: "Focus on specific topics and difficulty levels that matter to you"
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your data is protected with enterprise-grade security measures"
    },
    {
      icon: Zap,
      title: "Instant Results",
      description: "Get immediate feedback and detailed explanations for every answer"
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Student",
      content: "This platform helped me improve my test scores by 40%. The explanations are incredibly detailed!",
      avatar: "https://api.dicebear.com/7.x/initials/svg?seed=SJ"
    },
    {
      name: "Mike Chen",
      role: "Teacher",
      content: "I use this for my classes. The analytics help me understand where students need more support.",
      avatar: "https://api.dicebear.com/7.x/initials/svg?seed=MC"
    },
    {
      name: "Emily Davis",
      role: "Professional",
      content: "Perfect for certification prep. The variety of topics and difficulty levels is impressive.",
      avatar: "https://api.dicebear.com/7.x/initials/svg?seed=ED"
    }
  ];

  return (
    <div className="min-h-screen transition-colors duration-500" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0" style={{ 
          background: `linear-gradient(to right, var(--hero-gradient-from), var(--hero-gradient-to))` 
        }} />
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 left-10 w-72 h-72 rounded-full mix-blend-multiply filter blur-xl animate-pulse" 
               style={{ backgroundColor: 'var(--accent-color)', opacity: 0.1 }} />
          <div className="absolute bottom-20 right-10 w-72 h-72 rounded-full mix-blend-multiply filter blur-xl animate-pulse"
               style={{ backgroundColor: 'var(--accent-color)', opacity: 0.1 }} />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full mix-blend-multiply filter blur-2xl animate-pulse"
               style={{ backgroundColor: 'var(--accent-color)', opacity: 0.05 }} />
        </div>

        <div className="relative max-w-7xl mx-auto text-center">
          <div className="mb-8">
            {/* Welcome Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium mb-6"
                 style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--accent-color)' }}>
              <Star className="h-4 w-4 mr-2 animate-spin-slow" />
              Welcome to the Quiz Portal
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              <span style={{ 
                background: 'linear-gradient(to right, var(--accent-color), var(--button-bg))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Test Your Knowledge,
              </span>
              <br />
              <span style={{ color: 'var(--text-primary)' }}>Expand Your Mind</span>
            </h1>

            {/* Description */}
            <p className="text-xl md:text-2xl max-w-4xl mx-auto leading-relaxed mb-8"
               style={{ color: 'var(--text-secondary)' }}>
              Challenge yourself with our comprehensive quiz platform. Track your progress, compete with others, and
              master new subjects in an engaging, interactive environment.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {currentUser ? (
                <Link
                  to="/quizzes"
                  className="inline-flex items-center px-8 py-4 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl group"
                  style={{ 
                    background: 'linear-gradient(to right, var(--cta-gradient-from), var(--cta-gradient-to))',
                    color: 'var(--button-text)'
                  }}
                >
                  Continue Learning
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="inline-flex items-center px-8 py-4 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl group"
                    style={{ 
                      background: 'linear-gradient(to right, var(--cta-gradient-from), var(--cta-gradient-to))',
                      color: 'var(--button-text)'
                    }}
                  >
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                  <Link
                    to="/quizzes"
                    className="inline-flex items-center px-8 py-4 font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg border"
                    style={{ 
                      backgroundColor: 'var(--card-bg)', 
                      color: 'var(--text-primary)',
                      borderColor: 'var(--border-color)'
                    }}
                  >
                    Browse Quizzes
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 backdrop-blur-sm" style={{ backgroundColor: 'var(--bg-secondary)', opacity: 0.9 }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 group-hover:scale-110 transition-transform duration-300"
                   style={{ backgroundColor: 'var(--stat-bg-1)' }}>
                <BookOpen className="h-8 w-8" style={{ color: 'var(--button-text)' }} />
              </div>
              <div className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                {loading ? "..." : `${stats.totalQuizzes}+`}
              </div>
              <div style={{ color: 'var(--text-secondary)' }}>Active Quizzes</div>
            </div>
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 group-hover:scale-110 transition-transform duration-300"
                   style={{ backgroundColor: 'var(--stat-bg-2)' }}>
                <Users className="h-8 w-8" style={{ color: 'var(--button-text)' }} />
              </div>
              <div className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                {loading ? "..." : `${(stats.totalUsers / 1000).toFixed(0)}k+`}
              </div>
              <div style={{ color: 'var(--text-secondary)' }}>Happy Learners</div>
            </div>
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 group-hover:scale-110 transition-transform duration-300"
                   style={{ backgroundColor: 'var(--stat-bg-3)' }}>
                <TrendingUp className="h-8 w-8" style={{ color: 'var(--button-text)' }} />
              </div>
              <div className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>95%</div>
              <div style={{ color: 'var(--text-secondary)' }}>Success Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation Cards Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Choose Your Path</h2>
            <p className="text-xl max-w-3xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
              Explore different areas of our platform to enhance your learning experience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {navigationCards.map((card, index) => (
              <div
                key={index}
                className="group relative overflow-hidden border-0 shadow-sm hover:shadow-xl transition-all duration-300 rounded-2xl"
                style={{ backgroundColor: 'var(--card-bg)' }}
              >
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ backgroundColor: 'var(--card-hover-bg)' }}
                />

                <div className="p-8 relative">
                  <div
                    className="inline-flex items-center justify-center w-16 h-16 rounded-xl mb-6 group-hover:scale-110 transition-transform duration-300"
                    style={{ backgroundColor: 'var(--bg-secondary)' }}
                  >
                    <card.icon className="h-8 w-8" style={{ color: 'var(--accent-color)' }} />
                  </div>

                  <h3 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>{card.title}</h3>

                  <p className="mb-6 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{card.description}</p>

                  <Link
                    to={card.link}
                    className="inline-flex items-center font-semibold transition-colors group/link"
                    style={{ color: 'var(--accent-color)' }}
                  >
                    {card.linkText}
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover/link:translate-x-1" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20" style={{ backgroundColor: 'var(--features-bg)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Why Choose Our Platform?</h2>
            <p className="text-xl max-w-3xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
              Built with modern technology and designed for optimal learning outcomes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center group">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full shadow-md mb-6 group-hover:shadow-lg group-hover:scale-110 transition-all duration-300"
                     style={{ backgroundColor: 'var(--card-bg)' }}>
                  <feature.icon className="h-8 w-8" style={{ color: 'var(--accent-color)' }} />
                </div>
                <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>{feature.title}</h3>
                <p style={{ color: 'var(--text-secondary)' }}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20" style={{ backgroundColor: 'var(--testimonial-bg)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>What Our Users Say</h2>
            <p className="text-xl max-w-3xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
              Join thousands of satisfied learners who have transformed their knowledge
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="border-0 shadow-sm hover:shadow-lg transition-shadow duration-300 rounded-2xl p-6"
                   style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                <div className="flex items-center mb-4">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full mr-4"
                  />
                  <div>
                    <h4 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{testimonial.name}</h4>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{testimonial.role}</p>
                  </div>
                </div>
                <p className="italic mb-4" style={{ color: 'var(--text-secondary)' }}>"{testimonial.content}"</p>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!currentUser && (
        <section className="py-16 text-white"
                 style={{ 
                   background: `linear-gradient(to right, var(--cta-gradient-from), var(--cta-gradient-to))` 
                 }}>
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-bold mb-6">Ready to Start Your Learning Journey?</h2>
            <p className="text-xl mb-8" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              Join thousands of learners who are already improving their knowledge with our quizzes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/register"
                className="inline-flex items-center px-8 py-3 font-semibold rounded-xl transition-colors duration-200 shadow-lg"
                style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--accent-color)' }}
              >
                Create Free Account
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link 
                to="/quizzes"
                className="inline-flex items-center px-8 py-3 bg-transparent border-2 border-white text-white font-semibold rounded-xl hover:bg-white hover:text-blue-600 transition-colors duration-200"
              >
                Try Without Account
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
