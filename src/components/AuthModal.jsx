import React, { useState } from 'react';

const AuthModal = ({ isOpen, onClose, onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const API_BASE = 'http://localhost:8000/api';

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setLoading(true);
    const endpoint = isLogin ? '/login' : '/signup';

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const resData = await response.json();

      if (response.ok && resData.status === 'success') {
        const userData = isLogin ? resData.data : resData;

        // 1. 存入本地
        localStorage.setItem('user_id', userData.user_id);
        localStorage.setItem('user_email', email);
        localStorage.setItem('user_role', userData.role || 'user');

        alert(`${isLogin ? '登录' : '注册'}成功！`);

        // 2. 通知父组件更新状态
        if (onLoginSuccess) {
          onLoginSuccess({ user_id: userData.user_id, email: email, role: userData.role || 'user' });
        }

        onClose();
      } else {
        alert(resData.detail || resData.message || '操作失败，请重试');
      }
    } catch (error) {
      alert('无法连接到后端服务器，请确认后端已启动');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-[40px] w-full max-w-md p-10 relative">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 text-2xl"
        >
          ✕
        </button>

        <h2 className="text-3xl font-black text-wysa-green mb-6 text-center">
          {isLogin ? '欢迎回来' : '开启疗愈之旅'}
        </h2>

        <div className="space-y-4">
          <input
            type="email"
            placeholder="电子邮箱"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-4 rounded-2xl border bg-gray-50 outline-none focus:border-wysa-green transition-all"
          />
          <input
            type="password"
            placeholder="设置密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-4 rounded-2xl border bg-gray-50 outline-none focus:border-wysa-green transition-all"
          />

          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`w-full py-4 text-white rounded-full font-bold text-lg transition-all shadow-lg ${
              loading ? 'bg-gray-400' : 'bg-wysa-green hover:bg-wysa-coral'
            }`}
          >
            {loading ? '处理中...' : (isLogin ? '立即登录' : '立即注册')}
          </button>

          <p className="text-center text-gray-500 text-sm mt-4">
            {isLogin ? "还没有账号？" : "已有账号？"}
            <span
              onClick={() => setIsLogin(!isLogin)}
              className="text-wysa-green font-bold cursor-pointer ml-1 hover:underline"
            >
              {isLogin ? "点此注册" : "直接登录"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;