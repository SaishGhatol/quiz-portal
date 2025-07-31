import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import QuizCard from './QuizCard';
import { Search, Filter, Book, Star, RotateCw, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import DemoQuiz from './DemoQuiz';

const QuizList = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ category: '', difficulty: '', search: '' });
  const refineSearchRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const totalCards = 5;

  const categories = ['Programming', 'Science', 'Mathematics', 'History', 'Geography', 'General Knowledge'];
  const difficulties = ['Easy', 'Medium', 'Hard'];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % totalCards);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + totalCards) % totalCards);
  };

  useEffect(() => {
    const interval = setInterval(handleNext, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollContainerRef.current) {
      const cardWidth = scrollContainerRef.current.children[0].offsetWidth + 24;
      scrollContainerRef.current.scrollTo({
        left: currentIndex * cardWidth,
        behavior: 'smooth',
      });
    }
  }, [currentIndex]);

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.difficulty) params.append('difficulty', filters.difficulty);
      if (filters.search) params.append('search', filters.search);

      const response = await api.get(`/quizzes?${params}`);
      setQuizzes(response.data.quizzes);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, [filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchQuizzes();
  };

  const scrollToRefineSearch = () => {
    refineSearchRef.current.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="hero-section mb-24 text-center space-y-8 px-4">
  {/* Title */}
  <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
    Welcome to the Ultimate Quiz Arena
  </h1>

  {/* Subheading */}
  <p className="text-lg md:text-xl lg:text-2xl text-gray-700 font-medium max-w-3xl mx-auto leading-relaxed">
    Test your knowledge, compete with peers, and excel through interactive quizzes crafted by experts.
  </p>

  {/* Highlights */}
  <p className="text-sm md:text-base text-gray-500 tracking-wide">
    Updated Daily • Expert Verified • Community Driven
  </p>

  {/* Quiz Illustration */}
  <div className="flex justify-center mt-8">
    <img
  src="https://media.istockphoto.com/id/1616906708/vector/vector-speech-bubble-with-quiz-time-words-trendy-text-balloon-with-geometric-grapic-shape.jpg?s=612x612&w=0&k=20&c=3-qsji8Y5QSuShaMi6cqONlVZ3womknA5CiJ4PCeZEI="
  alt="Quiz Illustration"
  className="w-52 md:w-72 hover:scale-105 transition-transform duration-300"
/>

  </div>



  {/* Buttons */}
  <div className="flex justify-center space-x-6 mt-10">
    <Link onClick={scrollToRefineSearch} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transition duration-300 text-lg">
      Take a Quiz
    </Link>
    <Link
  to="/login"
  onClick={() => window.scrollTo(0, 0)}
  className="border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-semibold py-3 px-6 rounded-xl shadow-lg transition duration-300 text-lg inline-block"
>
  Login
</Link>
  </div>

  {/* About Card */}
  <div className="relative max-w-4xl mx-auto mt-14">
    <div className="p-8 md:p-10 bg-white/60 backdrop-blur-md rounded-3xl border border-gray-200/70 shadow-xl text-center hover:scale-105 hover:shadow-2xl transition duration-300">
      <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">About Quiz Portal</h3>
      <p className="text-gray-600 text-base md:text-lg leading-relaxed">
        Dive into a world of interactive learning with expert-crafted quizzes. Track your progress, challenge peers, and make every quiz an opportunity to grow.
      </p>
    </div>
  </div>
</div>


      {/* Features Section */}
      <div align="center" className="max-w-6xl mx-auto mb-24 px-4">
        <h2 className="text-4xl font-extrabold text-center text-gray-800 mb-14">Explore Our Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Features here (same as before) */}
          {[{ icon: Book, title: 'Diverse Topics', color: 'blue-600', desc: 'Explore quizzes across Programming, Science, History, and more.' },
            { icon: Star, title: 'Leaderboard', color: 'purple-600', desc: 'Compete with others and climb the leaderboard.' },
            { icon: RotateCw, title: 'Timed Quizzes', color: 'pink-600', desc: 'Test your knowledge under time constraints.' },
            { icon: AlertCircle, title: 'Detailed Explanations', color: 'green-600', desc: 'Learn from mistakes with in-depth explanations.' }]
            .map((feature, i) => (
              <div key={i} className="group p-6 bg-white/80 backdrop-blur-md rounded-3xl border border-gray-200 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ease-in-out">
                <div className={`mb-4 text-${feature.color} group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="h-10 w-10 mx-auto" strokeWidth={2} />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.desc}</p>
              </div>
          ))}
        </div>
      </div>

      {/* Demo Quiz Section */}
      <div>
        <DemoQuiz />
      </div>

      {/* Testimonials Carousel */}
      <div className="testimonial-section my-28 pb-0 w-full bg-gradient-to-b from-indigo-50 to-white py-20 overflow-hidden">
  <h2 className="text-5xl font-extrabold text-center text-gray-800 mb-16">
    Hear From Our Students
  </h2>

  <div className="relative max-w-7xl mx-auto px-6">
    {/* Carousel Container */}
    <div
      ref={scrollContainerRef}
      className="testimonial-carousel flex gap-8 overflow-hidden snap-x snap-mandatory pb-10"
    >
      {[
        {
          name: "Emma Williams",
          role: "Student",
          feedback: "Quiz Portal made complex topics simple. The in-depth explanations and interactive quizzes boosted my confidence.",
          image: "https://randomuser.me/api/portraits/women/44.jpg",
        },
        {
          name: "Michael Johnson",
          role: "Student",
          feedback: "The leaderboard feature keeps me motivated. Competing with friends has never been this fun and educational!",
          image: "https://randomuser.me/api/portraits/men/32.jpg",
        },
        {
          name: "Sophia Lee",
          role: "Student",
          feedback: "I love how seamless the UI is. The quiz categories are diverse and help me stay sharp across domains.",
          image: "https://randomuser.me/api/portraits/women/68.jpg",
        },
        {
          name: "David Brown",
          role: "Student",
          feedback: "From beginner-friendly quizzes to expert challenges, Quiz Portal has been my go-to for consistent learning.",
          image: "https://randomuser.me/api/portraits/men/52.jpg",
        },
        {
          name: "Olivia Martinez",
          role: "Student",
          feedback: "I appreciate the detailed feedback after every quiz. It's like having a personal tutor guiding me.",
          image: "https://randomuser.me/api/portraits/women/53.jpg",
        },
      ].map((user, index) => (
        <div
          key={index}
          className="testimonial-card min-w-[300px] md:min-w-[350px] bg-white/80 backdrop-blur-lg rounded-3xl border border-gray-200 shadow-md 
                     p-8 snap-center transform transition-all duration-500 ease-in-out group hover:scale-105 hover:shadow-2xl"
        >
          <div className="flex items-center mb-5">
            <img
              src={user.image}
              alt={user.name}
              className="h-16 w-16 rounded-full mr-4 border-2 border-blue-500 group-hover:rotate-3 transition-transform duration-300"
            />
            <div>
              <h3 className="text-xl font-semibold text-gray-800">{user.name}</h3>
              <p className="text-gray-600 text-sm">{user.role}</p>
            </div>
          </div>
          <p className="text-gray-700 text-base leading-relaxed">
            "{user.feedback}"
          </p>
        </div>
      ))}
    </div>

    {/* Navigation Buttons */}
    <button
      onClick={handlePrev}
      className="absolute top-1/2 left-2 md:left-6 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-3 shadow-lg transition duration-300 z-10 opacity-80 hover:opacity-100"
    >
      <ChevronLeft className="h-6 w-6 text-gray-700" />
    </button>
    <button
      onClick={handleNext}
      className="absolute top-1/2 right-2 md:right-6 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-3 shadow-lg transition duration-300 z-10 opacity-80 hover:opacity-100"
    >
      <ChevronRight className="h-6 w-6 text-gray-700" />
    </button>
  </div>
</div>



      {/* Call to Action Buttons */}
      <div className="max-w-6xl mx-auto my-20 grid grid-cols-1 md:grid-cols-3 gap-6 px-4">
        <button onClick={scrollToRefineSearch} className="group w-full">
          <div className="p-8 bg-gradient-to-br from-white/70 to-white/90 backdrop-blur-md rounded-2xl border border-gray-200/50 shadow-md text-center hover:scale-105 hover:shadow-2xl transition duration-300">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Start Quiz</h3>
            <p className="text-gray-600 text-sm">Challenge yourself with our latest quizzes</p>
          </div>
        </button>
        <Link to="/Profile" className="group">
          <div className="p-8 bg-gradient-to-br from-white/70 to-white/90 backdrop-blur-md rounded-2xl border border-gray-200/50 shadow-md text-center hover:scale-105 hover:shadow-2xl transition duration-300">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Leaderboard</h3>
            <p className="text-gray-600 text-sm">See where you stand among top performers</p>
          </div>
        </Link>
        <Link to="/admin" className="group">
          <div className="p-8 bg-gradient-to-br from-white/70 to-white/90 backdrop-blur-md rounded-2xl border border-gray-200/50 shadow-md text-center hover:scale-105 hover:shadow-2xl transition duration-300">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Admin Panel</h3>
            <p className="text-gray-600 text-sm">Manage quizzes, users, and platform stats</p>
          </div>
        </Link>
      </div>

      {/* Filter Section */}
      <div ref={refineSearchRef} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl mb-12 border border-gray-200/60 p-6 lg:p-8">
  <div className="flex items-center mb-6 gap-2 text-blue-600">
    <Filter className="h-6 w-6" strokeWidth={2} />
    <h2 className="text-2xl font-semibold">Refine Your Search</h2>
  </div>

  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
    {/* Category Filter */}
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2 ml-1">Category</label>
      <div className="relative">
        <select
          name="category"
          value={filters.category}
          onChange={handleFilterChange}
          className="w-full pl-4 pr-12 py-3 border border-gray-300/80 rounded-xl bg-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 shadow-sm appearance-none"
        >
          <option value="">All Categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
          <Book className="h-5 w-5 text-gray-400" />
        </div>
      </div>
    </div>

    {/* Difficulty Filter */}
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2 ml-1">Difficulty</label>
      <div className="relative">
        <select
          name="difficulty"
          value={filters.difficulty}
          onChange={handleFilterChange}
          className="w-full pl-4 pr-12 py-3 border border-gray-300/80 rounded-xl bg-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 shadow-sm appearance-none"
        >
          <option value="">All Levels</option>
          {difficulties.map((difficulty) => (
            <option key={difficulty} value={difficulty}>{difficulty}</option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
          <Star className="h-5 w-5 text-gray-400" />
        </div>
      </div>
    </div>

    {/* Search Input */}
    <div className="md:col-span-2">
      <label className="block text-sm font-medium text-gray-700 mb-2 ml-1">Search</label>
      <form onSubmit={handleSearch} className="relative">
        <input
          type="text"
          name="search"
          value={filters.search}
          onChange={handleFilterChange}
          placeholder="Search quizzes..."
          className="w-full pl-4 pr-14 py-3 border border-gray-300/80 rounded-xl bg-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 shadow-sm"
        />
        <button
          type="submit"
          className="absolute inset-y-0 right-3 flex items-center justify-center p-2 rounded-lg bg-blue-600/10 hover:bg-blue-600/20"
        >
          <Search className="h-5 w-5 text-blue-600" />
        </button>
      </form>
    </div>
  </div>
</div>


      {/* Quiz Results */}
      <div className="mb-6 flex items-center justify-between px-2">
        <div className="text-gray-600 font-medium">
          <span className="text-blue-600">{quizzes.length}</span> results found
          {(filters.category || filters.difficulty || filters.search) && (
            <span className="ml-2 text-sm text-gray-500">(filtered)</span>
          )}
        </div>
        <button onClick={() => setFilters({ category: '', difficulty: '', search: '' })} className="text-sm text-gray-500 hover:text-blue-600 flex items-center gap-1">
          <RotateCw className="h-4 w-4" />
          Reset filters
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quizzes.map(quiz => (
          <QuizCard key={quiz._id} quiz={quiz} />
        ))}
      </div>
    </div>
  );
};

export default QuizList;
