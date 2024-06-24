
import io from "socket.io-client";
import { useState, useEffect } from "react";
import Chat from "./Chat";
import Sidebar from "./Sidebar";
import { ChakraProvider, button} from "@chakra-ui/react";

const socket = io.connect("http://localhost:3001");

function App() {
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [error, setError] = useState("");
  const [otherUser, setOtherUser] = useState("");
  const [messageHistory, setMessageHistory] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");

  useEffect(() => {
    socket.on("room_full", (data) => {
      setError(data.message);
    });

    socket.on("joined_chat", () => {
      setShowChat(true);
    });

    socket.on("chat_started", (data) => {
      setOtherUser(data.otherUser);
      setMessageHistory((prevHistory) => {
        const newHistory = [...prevHistory];
        const userIndex = newHistory.findIndex(
          (item) => item.username === data.otherUser
        );
        if (userIndex === -1) {
          newHistory.push({ username: data.otherUser, room });
        } else {
          newHistory[userIndex].room = room;
        }
        return newHistory;
      });
    });

    socket.on("user_left", () => {
      setOtherUser("");
      alert("The other user has left the chat.");
    });
  }, [room]);

  const joinChat = () => {
    if (username !== "" && room !== "") {
      setError(""); // Clear any previous error message
      socket.emit("join_chat", { room, username });
    }
  };

  const handleSelectUser = (user) => {
    if (username !== "") {
      setSelectedUser(user.username);
      setRoom(user.room);
      setShowChat(true);
      socket.emit("join_chat", { room: user.room, username });
    } else {
      setError("Please enter a username first.");
    }
  };

  const handleBack = () => {
    setShowChat(false);
    setRoom("");
    setOtherUser("");
  };

  return (
    <ChakraProvider>
    <div className="App">
      <Sidebar messageHistory={messageHistory} onSelectUser={handleSelectUser} />
      <div className="mainContent">
        {!showChat ? (
          <div className="joinChatContainer">
            <h3>Join A Chat</h3>
            <input
              type="text"
              placeholder="John..."
              onChange={(event) => {
                setUsername(event.target.value);
              }}
            />
            <input
              type="text"
              placeholder="Room ID..."
              onChange={(event) => {
                setRoom(event.target.value);
              }}
            />
            <button onClick={joinChat}>Join Chat</button>
            {error && <p>{error}</p>}
          </div>
        ) : (
          <Chat
            socket={socket}
            username={username}
            room={room}
            otherUser={otherUser}
            onBack={handleBack}
          />
        )}
      </div>
    </div>
    </ChakraProvider>
  );
}

export default App;
