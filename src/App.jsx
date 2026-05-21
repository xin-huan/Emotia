import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import Home from './pages/Home';
import AboutEmotia from './pages/AboutEmotia';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import Interactive from './pages/Interactive';
import Agent from './pages/AgentTest';
import Test from './pages/Test';
import CheckInTest from './pages/CheckInTest';
import ProfileDev from './pages/ProfileDev'

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function App() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [user, setUser] = useState(null);

  // 初始化检查
  useEffect(() => {
    const savedUserId = localStorage.getItem('user_id');
    const savedEmail = localStorage.getItem('user_email');
    if (savedUserId) {
      setUser({ user_id: savedUserId, email: savedEmail });
    }
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
    setUser(null);
  };

  return (
    <Router>
      <ScrollToTop />
      <Navbar
        onLoginClick={() => setIsAuthModalOpen(true)}
        user={user}
        onLogout={handleLogout}
      />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<AboutEmotia />} />
        <Route path="/interactive" element={<Interactive />} />
        <Route path="/agent" element={<Agent />} />
        <Route path="/Test" element={<Test />} />
        <Route path="/checkin" element={<CheckInTest />} />
        <Route path="/dev-me" element={<ProfileDev />} />
        <Route path="/ProfileDev" element={<ProfileDev />} />
        <Route path="/profile" element={<ProfileDev />} />
      </Routes>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </Router>
  );
}

export default App;