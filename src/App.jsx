import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import Home from './pages/Home';
import AboutEmotia from './pages/AboutEmotia';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import Interactive from './pages/Interactive';
import Agent from './pages/AgentTest';
import Test from './pages/Test';
import CheckInTest from './pages/CheckInTest';

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