import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import React, { useState } from 'react';
import Home from './pages/Home';
import AboutEmotia from './pages/AboutEmotia';
import Navbar from './components/Navbar'; // 假设你把 Navbar 抽成了组件
import AuthModal from './components/AuthModal'; // 假设你把弹窗也抽成了组件

function App() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  return (
    <Router>
      {/* 1. 导航栏放在 Routes 外面，它就会出现在所有页面 */}
      <Navbar onLoginClick={() => setIsAuthModalOpen(true)} />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<AboutEmotia />} />
      </Routes>

      {/* 2. 登录弹窗也放在全局，方便所有页面调用 */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </Router>
  );
}

export default App;