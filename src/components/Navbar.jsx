import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // 1. 引入 useLocation
import GooeyNav from '../GooeyNav';

const navItems = [
  { label: '首页', href: '/' },
  { label: '认识', href: '/about' },
  { label: '互动论坛', href: '#' },
  { label: 'Agent互动', href: '#' },
  { label: '测试', href: '#' },
  { label: '活动打卡', href: '#' },
  { label: '个人空间', href: '#' }
];

const Navbar = ({ onLoginClick }) => {
  const navigate = useNavigate();
  const location = useLocation(); // 2. 获取当前路由地址，例如 "/" 或 "/about"

  return (
    <nav className="fixed top-0 left-0 w-full bg-wysa-green px-12 md:px-24 py-3 flex items-center justify-between z-50 shadow-md">
      <div
        className="text-3xl font-extrabold text-white cursor-pointer"
        onClick={() => navigate('/')}
      >
        Emotia
      </div>

      <div className="flex-1 flex justify-center text-sm font-medium relative">
        <GooeyNav
          items={navItems}
          animationTime={500}
          onItemClick={(item) => navigate(item.href)}
          // 3. 将当前路径传进去，让组件知道谁是激活状态
          activePath={location.pathname}
        />
      </div>

      <button
        onClick={onLoginClick}
        className="bg-wysa-pink text-wysa-green px-6 py-1.5 rounded-full shadow-sm hover:bg-white transition text-sm font-bold cursor-pointer"
      >
        登录
      </button>
    </nav>
  );
};

export default Navbar;