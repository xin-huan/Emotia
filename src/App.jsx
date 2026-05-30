import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import Home from './pages/Home';
import AboutEmotia from './pages/AboutEmotia';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import Interactive from './pages/Interactive';
import Agent from './pages/AgentTest';
import Test from './pages/Test';
import CheckInTest from './pages/CheckInTest';
import ProfileDev from './pages/ProfileDev'
import Intro from './pages/Intro'
import AdminDashboard from './pages/AdminDashboard';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function AppContent() {
  const location = useLocation();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [user, setUser] = useState(null);
  const isIntroPage = location.pathname === '/' || location.pathname === '/intro';

  // 初始化检查
  useEffect(() => {
    const savedUserId = localStorage.getItem('user_id');
    const savedEmail = localStorage.getItem('user_email');
    const savedRole = localStorage.getItem('user_role');
    if (savedUserId) {
      setUser({ user_id: savedUserId, email: savedEmail, role: savedRole || 'user' });
    }
  }, []);

  // 全局 AOS 滚动动画初始化
  useEffect(() => {
    AOS.init({
      duration: 800,
      once: false,
      mirror: true,
      easing: 'ease-in-out',
      offset: 80,
    });
    document.documentElement.style.scrollBehavior = 'smooth';
  }, []);

  // 登录成功回调
  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setIsAuthModalOpen(false);
  };

  // 退出登录：清理缓存并重置状态
  const handleLogout = () => {
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_role');
    setUser(null);
  };

  return (
    <>
      <ScrollToTop />
      {!isIntroPage && (
        <Navbar
          onLoginClick={() => setIsAuthModalOpen(true)}
          user={user}
          onLogout={handleLogout}
        />
      )}

      <Routes>
        <Route path="/" element={<Intro />} />
        <Route path="/home" element={<Home />} />
        <Route path="/about" element={<AboutEmotia />} />
        <Route path="/interactive" element={<Interactive />} />
        <Route path="/agent" element={<Agent />} />
        <Route path="/Test" element={<Test />} />
        <Route path="/checkin" element={<CheckInTest />} />
        <Route path="/dev-me" element={<ProfileDev />} />
        <Route path="/ProfileDev" element={<ProfileDev />} />
        <Route path="/profile" element={<ProfileDev />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>

      {!isIntroPage && (
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}
    </>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;