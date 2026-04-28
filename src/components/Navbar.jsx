import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import GooeyNav from '../GooeyNav';

const navItems = [
  { label: '首页', href: '/' },
  { label: '认识', href: '/about' },
  { label: '互动论坛', href: '/interactive' },
  { label: 'Agent互动', href: '/Agent' },
  { label: '测试', href: '/Test' },
  { label: '活动打卡', href: '#' },
  { label: '个人空间', href: '#' }
];

const Navbar = ({ onLoginClick, user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

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
          activePath={location.pathname}
        />
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          // ✅ 登录后的状态：外层增加 group 类名用于触发悬停
          <div className="relative group flex items-center gap-3 cursor-pointer py-2">

            <div className="text-right hidden sm:block">
              <p className="text-white text-[10px] opacity-60 font-bold uppercase tracking-widest">Member</p>
              <p className="text-white text-sm font-bold truncate max-w-[100px]">
                {user.email ? user.email.split('@')[0] : '用户'}
              </p>
            </div>

            <div className="w-10 h-10 rounded-full border-2 border-wysa-pink bg-white/20 flex items-center justify-center text-white font-black group-hover:bg-wysa-pink transition-all">
              {user.email ? user.email[0].toUpperCase() : 'U'}
            </div>

            {/* ✅ 悬停下拉菜单 */}
            <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-2xl shadow-2xl py-3 border border-gray-100
                            opacity-0 invisible translate-y-2 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-200 z-[60]">

              {/* 账号名字展示区 */}
              <div className="px-4 py-2 border-b border-gray-50 mb-1">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">当前账号</p>
                <p className="text-sm font-bold text-gray-700 truncate">{user.email}</p>
              </div>

              {/* 功能操作区 */}
              <button
                onClick={() => navigate('/profile')}
                className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-wysa-green transition-colors"
              >
                个人空间
              </button>

              <button
                onClick={onLogout}
                className="w-full text-left px-4 py-2 text-sm text-red-500 font-bold hover:bg-red-50 transition-colors"
              >
                退出登录
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={onLoginClick}
            className="bg-wysa-pink text-wysa-green px-6 py-1.5 rounded-full shadow-sm hover:bg-white transition text-sm font-bold cursor-pointer"
          >
            登录
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;