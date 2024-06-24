import React from 'react';

function Sidebar({ messageHistory, onSelectUser }) {
  return (
    <div className="sidebar">
      <h3>Chats</h3>
      <ul>
        {messageHistory.map((user, index) => (
          <li key={index} onClick={() => onSelectUser(user)}>
            {user.username} (Room: {user.room})
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Sidebar;
