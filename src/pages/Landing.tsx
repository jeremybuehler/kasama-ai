import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { KasamaLogo } from '../components/ui/KasamaLogo';
import { ArrowRight, Heart, Shield, Zap, Users, CheckCircle, Menu, X } from 'lucide-react';

const Landing: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="relative z-20 bg-white/90 backdrop-blur-sm border-b border-gray-100 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4 md:py-6">
            <KasamaLogo width={120} className="h-auto sm:w-[140px]" />
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">
                Features
              </a>
              <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 transition-colors">
                How It Works
              </a>
              <a href="#testimonials" className="text-gray-600 hover:text-gray-900 transition-colors">
                Stories
              </a>
              <Link 
                to="/login"
                className="bg-gradient-primary text-white px-6 py-2 rounded-full font-medium hover:shadow-lg transition-all duration-300"
              >
                Get Started
              </Link>
            </nav>
            
            {/* Mobile Navigation */}
            <div className="md:hidden flex items-center space-x-4">
              <Link 
                to="/login"
                className="bg-gradient-primary text-white px-4 py-2 rounded-full text-sm font-medium"
              >
                Login
              </Link>
              <button 
                onClick={toggleMobileMenu}
                className="text-gray-600 hover:text-gray-900 p-2"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
          
          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg">
              <nav className="px-4 py-4 space-y-4">
                <a 
                  href="#features" 
                  className="block text-gray-600 hover:text-gray-900 transition-colors py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Features
                </a>
                <a 
                  href="#how-it-works" 
                  className="block text-gray-600 hover:text-gray-900 transition-colors py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  How It Works
                </a>
                <a 
                  href="#testimonials" 
                  className="block text-gray-600 hover:text-gray-900 transition-colors py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Stories
                </a>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Content Wrapper for consistent vertical rhythm */}
      <main className="bg-white">
      {/* Hero Section */}
      <section className="relative py-12 sm:py-16 md:py-24 lg:py-32 overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-10">
          <div className="grid lg:grid-cols-2 gap-10 sm:gap-12 lg:gap-16 items-center">
            <div className="text-center lg:text-left order-2 lg:order-1">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
                Build Stronger
                <span className="bg-gradient-primary bg-clip-text text-transparent block sm:inline"> Relationships</span>
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-6 sm:mb-8 lg:mb-10 max-w-2xl mx-auto lg:mx-0">
                Your AI-powered companion for developing healthier communication, deeper connections, 
                and lasting relationship skills that transform how you connect with others.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
                <Link 
                  to="/login"
                  className="inline-flex items-center justify-center bg-gradient-primary text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold text-base sm:text-lg shadow-lg hover:shadow-xl transition-all duration-300 group"
                >
                  Start Your Journey
                  <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <button className="inline-flex items-center justify-center border border-gray-300 text-gray-700 px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold text-base sm:text-lg hover:bg-gray-50 transition-colors">
                  Learn More
                </button>
              </div>
            </div>
            <div className="relative order-1 lg:order-2 mt-0 mb-8 lg:mt-0 lg:mb-0">
              <div className="relative mx-auto max-w-xs sm:max-w-md lg:max-w-lg">
                {/* Decorative background */}
                <div className="absolute inset-0 bg-gradient-soft rounded-3xl transform rotate-3 opacity-10"></div>
                <div className="relative bg-white rounded-3xl shadow-2xl p-4 sm:p-6 lg:p-8 border border-gray-100">
                  <div className="text-center mb-4 sm:mb-6">
                    <KasamaLogo width={80} className="mx-auto mb-3 sm:w-[100px] lg:w-[120px] sm:mb-4" />
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Personal Growth Dashboard</h3>
                    <p className="text-gray-600 text-xs sm:text-sm">Track your relationship development journey</p>
                  </div>
                  
                  {/* Mock dashboard elements */}
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center justify-between p-2 sm:p-3 bg-gradient-soft rounded-lg">
                      <span className="text-xs sm:text-sm font-medium text-gray-700">Communication Skills</span>
                      <span className="text-xs sm:text-sm font-bold text-purple-600">85%</span>
                    </div>
                    <div className="flex items-center justify-between p-2 sm:p-3 bg-green-50 rounded-lg">
                      <span className="text-xs sm:text-sm font-medium text-gray-700">Active Listening</span>
                      <span className="text-xs sm:text-sm font-bold text-green-600">92%</span>
                    </div>
                    <div className="flex items-center justify-between p-2 sm:p-3 bg-blue-50 rounded-lg">
                      <span className="text-xs sm:text-sm font-medium text-gray-700">Emotional Intelligence</span>
                      <span className="text-xs sm:text-sm font-bold text-blue-600">78%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 sm:py-20 md:py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-10">
          <div className="text-center mb-10 sm:mb-14 lg:mb-20">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
              Everything You Need to 
              <span className="bg-gradient-primary bg-clip-text text-transparent block sm:inline"> Grow Together</span>
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto">
              Kasama combines AI-powered insights with proven relationship psychology to help you build lasting connections.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10 lg:gap-14">
            <div className="text-center p-4 sm:p-0">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-primary rounded-2xl mb-4 sm:mb-6">
                <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Personalized Insights</h3>
              <p className="text-gray-600 text-sm sm:text-base">
                Receive AI-powered recommendations tailored to your unique relationship patterns and growth areas.
              </p>
            </div>

            <div className="text-center p-4 sm:p-0">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-accent rounded-2xl mb-4 sm:mb-6">
                <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Daily Practices</h3>
              <p className="text-gray-600 text-sm sm:text-base">
                Build healthy habits with guided exercises, mindful check-ins, and skill-building activities.
              </p>
            </div>

            <div className="text-center p-4 sm:p-0">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-purple-500 rounded-2xl mb-4 sm:mb-6">
                <Users className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Relationship Mapping</h3>
              <p className="text-gray-600 text-sm sm:text-base">
                Understand your communication styles and learn how to connect more effectively with others.
              </p>
            </div>

            <div className="text-center p-4 sm:p-0">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-green-500 rounded-2xl mb-4 sm:mb-6">
                <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Progress Tracking</h3>
              <p className="text-gray-600 text-sm sm:text-base">
                Monitor your growth with detailed analytics and celebrate milestones in your relationship journey.
              </p>
            </div>

            <div className="text-center p-4 sm:p-0">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-orange-500 rounded-2xl mb-4 sm:mb-6">
                <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Goal Setting</h3>
              <p className="text-gray-600 text-sm sm:text-base">
                Set meaningful relationship goals and receive guidance to achieve them step by step.
              </p>
            </div>

            <div className="text-center p-4 sm:p-0">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-pink-500 rounded-2xl mb-4 sm:mb-6">
                <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Mindful Connection</h3>
              <p className="text-gray-600 text-sm sm:text-base">
                Learn to be present in your relationships with mindfulness techniques and emotional awareness tools.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 sm:py-20 md:py-24">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-10">
          <div className="text-center mb-10 sm:mb-14 lg:mb-20">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
              Your Path to 
              <span className="bg-gradient-primary bg-clip-text text-transparent block sm:inline"> Better Relationships</span>
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto">
              Start your journey in three simple steps and begin transforming your connections today.
            </p>
          </div>

          <div className="grid sm:grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 lg:gap-12">
            <div className="text-center p-4 sm:p-0">
              <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-gradient-primary rounded-full text-white font-bold text-lg sm:text-xl mb-4 sm:mb-6">
                1
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Assessment</h3>
              <p className="text-gray-600 text-sm sm:text-base">
                Complete a comprehensive relationship assessment to understand your current patterns and growth opportunities.
              </p>
            </div>

            <div className="text-center p-4 sm:p-0">
              <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-gradient-accent rounded-full text-white font-bold text-lg sm:text-xl mb-4 sm:mb-6">
                2
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Personalized Plan</h3>
              <p className="text-gray-600 text-sm sm:text-base">
                Receive a customized development plan with daily practices, insights, and goals tailored to your needs.
              </p>
            </div>

            <div className="text-center p-4 sm:p-0">
              <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-purple-500 rounded-full text-white font-bold text-lg sm:text-xl mb-4 sm:mb-6">
                3
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Growth & Insights</h3>
              <p className="text-gray-600 text-sm sm:text-base">
                Track your progress, practice new skills, and receive ongoing AI-powered insights to accelerate your growth.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 md:py-24">
        <div className="max-w-4xl mx-auto text-center px-6 sm:px-8 lg:px-10">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
            Ready to Transform Your 
            <span className="bg-gradient-primary bg-clip-text text-transparent block sm:inline">Relationships?</span>
          </h2>
          <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8 lg:mb-10">
            Join thousands of people who are already building stronger, healthier connections with Kasama.
          </p>
          <Link 
            to="/login"
            className="inline-flex items-center justify-center bg-gradient-primary text-white px-8 sm:px-10 py-3 sm:py-4 rounded-full font-semibold text-base sm:text-lg shadow-lg hover:shadow-xl transition-all duration-300 group"
          >
            Start Your Free Journey
            <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-16 sm:py-20 md:py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-10">
          <div className="text-center mb-10 sm:mb-14 lg:mb-20">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
              Real Stories of 
              <span className="bg-gradient-primary bg-clip-text text-transparent block sm:inline"> Connection</span>
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto">
              See how Kasama has helped people build stronger, more meaningful relationships.
            </p>
          </div>

          <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="bg-white p-4 sm:p-6 lg:p-8 rounded-2xl shadow-lg">
              <p className="text-gray-600 mb-4 sm:mb-6 italic text-sm sm:text-base">
                "Kasama helped me understand my communication patterns and gave me practical tools to improve my relationships. 
                The daily insights are incredibly valuable."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-primary rounded-full flex items-center justify-center text-white font-semibold">
                  S
                </div>
                <div className="ml-3 sm:ml-4">
                  <h4 className="font-semibold text-gray-900 text-sm sm:text-base">Sarah M.</h4>
                  <p className="text-gray-500 text-xs sm:text-sm">Marketing Professional</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-6 lg:p-8 rounded-2xl shadow-lg">
              <p className="text-gray-600 mb-4 sm:mb-6 italic text-sm sm:text-base">
                "The relationship assessment was eye-opening. I finally understand why I struggle with certain conversations 
                and now I have a clear path to improve."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-accent rounded-full flex items-center justify-center text-white font-semibold">
                  M
                </div>
                <div className="ml-3 sm:ml-4">
                  <h4 className="font-semibold text-gray-900 text-sm sm:text-base">Michael R.</h4>
                  <p className="text-gray-500 text-xs sm:text-sm">Software Engineer</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-6 lg:p-8 rounded-2xl shadow-lg md:col-span-2 lg:col-span-1">
              <p className="text-gray-600 mb-4 sm:mb-6 italic text-sm sm:text-base">
                "The mindful check-ins have transformed how I show up in my relationships. 
                I feel more present and connected than ever before."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                  A
                </div>
                <div className="ml-3 sm:ml-4">
                  <h4 className="font-semibold text-gray-900 text-sm sm:text-base">Alex K.</h4>
                  <p className="text-gray-500 text-xs sm:text-sm">Teacher</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 sm:py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-6 sm:mb-8">
            <div className="sm:col-span-2 lg:col-span-2 text-center sm:text-left">
              <KasamaLogo width={120} className="mb-3 sm:mb-4 brightness-0 invert mx-auto sm:mx-0 sm:w-[160px]" />
              <p className="text-gray-400 text-sm sm:text-base max-w-md mx-auto sm:mx-0">
                Your AI-powered companion for building stronger, healthier relationships 
                through personalized insights and guided growth.
              </p>
            </div>
            <div className="text-center sm:text-left">
              <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Features</h3>
              <ul className="space-y-2 text-gray-400 text-sm sm:text-base">
                <li><a href="#" className="hover:text-white transition-colors">Relationship Assessment</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Daily Practices</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Progress Tracking</a></li>
                <li><a href="#" className="hover:text-white transition-colors">AI Insights</a></li>
              </ul>
            </div>
            <div className="text-center sm:text-left">
              <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Support</h3>
              <ul className="space-y-2 text-gray-400 text-sm sm:text-base">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 sm:pt-8 text-center text-gray-400">
            <p className="text-xs sm:text-sm">&copy; 2025 Kasama. All rights reserved. Made with ❤️ for stronger relationships.</p>
          </div>
        </div>
      </footer>
      </main>
    </div>
  );
};

export default Landing;
