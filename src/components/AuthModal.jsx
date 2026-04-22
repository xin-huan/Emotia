import React from 'react';

const AuthModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-[40px] w-full max-w-md p-10 relative">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 text-2xl"
        >
          ✕
        </button>
        <h2 className="text-3xl font-black text-wysa-green mb-6 text-center">欢迎回来</h2>
        <div className="space-y-4">
          <input
            type="email"
            placeholder="邮箱"
            className="w-full p-4 rounded-2xl border bg-gray-50 outline-none focus:border-wysa-green"
          />
          <input
            type="password"
            placeholder="密码"
            className="w-full p-4 rounded-2xl border bg-gray-50 outline-none focus:border-wysa-green"
          />
          <button className="w-full py-4 bg-wysa-green text-white rounded-full font-bold text-lg hover:bg-wysa-coral transition-colors shadow-lg">
            立即登录
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;