// 给前端的示意组件：MessageCenter.jsx
import React, { useEffect, useState } from 'react';

export default function MessageCenter() {
  const [notifs, setNotifs] = useState([]);
  const userId = localStorage.getItem('user_id');

  useEffect(() => {
    fetch(`http://localhost:8000/api/user/notifications/${userId}`)
      .then(r => r.json())
      .then(data => setNotifs(data));
  }, []);

  return (
    <div className="p-4">
      <h3>🔔 互动消息</h3>
      {notifs.map(n => (
        <div key={n.id} className="border-b py-2 text-sm">
          <b>{n.actor.username}</b> 
          {n.type === 'like' ? ' 给你的倾诉点了一个共鸣' : ' 回复了你的问题'}
          <p className="text-gray-400 italic">"{n.post.content.substring(0,10)}..."</p>
        </div>
      ))}
    </div>
  );
}