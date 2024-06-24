import "./App.css";
import React, { useEffect, useState } from "react";
import ScrollToBottom from "react-scroll-to-bottom";
import {
  ChakraProvider,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Button,
  useDisclosure,
} from "@chakra-ui/react";

function Chat({ socket, username, room, otherUser }) {
  const [currentMessage, setCurrentMessage] = useState("");
  const [messageList, setMessageList] = useState([]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = React.useRef();

  useEffect(() => {
    const receiveMessage = (data) => {
      setMessageList((list) => [...list, data]);
    };

    const receiveDeleteMessage = (messageId) => {
      setMessageList((list) =>
        list.filter((message) => message.id !== messageId)
      );
    };

    const receiveUpdateMessage = (updatedMessage) => {
      setMessageList((list) =>
        list.map((message) =>
          message.id === updatedMessage.id ? updatedMessage : message
        )
      );
    };

    socket.on("receive_message", receiveMessage);
    socket.on("receive_delete_message", receiveDeleteMessage);
    socket.on("receive_update_message", receiveUpdateMessage);

    return () => {
      socket.off("receive_message", receiveMessage);
      socket.off("receive_delete_message", receiveDeleteMessage);
      socket.off("receive_update_message", receiveUpdateMessage);
    };
  }, [socket]);

  const sendMessage = async () => {
    if (currentMessage !== "") {
      const messageData = {
        id: socket.id + Date.now(), // Unique ID for each message
        room: room,
        author: username,
        message: currentMessage,
        time:
          new Date(Date.now()).getHours() +
          ":" +
          new Date(Date.now()).getMinutes().toString().padStart(2, "0"),
      };

      await socket.emit("send_message", messageData);
      setMessageList((list) => [...list, messageData]);
      setCurrentMessage("");
    }
  };

  const confirmDelete = (messageId) => {
    onOpen();
    cancelRef.current = () => onClose();
  };

  const handleDelete = (messageId) => {
    socket.emit("delete_message", { room, messageId });
    setMessageList((list) =>
      list.filter((message) => message.id !== messageId)
    );
    onClose();
  };

  const updateMessage = (messageToUpdate) => {
    const newMessage = prompt("Edit your message:", messageToUpdate.message);
    if (newMessage) {
      const updatedMessage = {
        ...messageToUpdate,
        message: newMessage,
        edited: true,
      };
      socket.emit("update_message", { room, updatedMessage });
      setMessageList((list) =>
        list.map((message) =>
          message.id === updatedMessage.id ? updatedMessage : message
        )
      );
    }
  };

  return (
    <ChakraProvider>
    <div className="chat-window">
      <div className="chat-header">
        <button className="back-button" onClick={() => window.location.reload()}>
          Back
        </button>
        <p>Chatting with {otherUser}</p>
      </div>
      <div className="chat-body">
        <ScrollToBottom className="message-container">
          {messageList.map((messageContent, index) => {
            return (
              <div
                key={index}
                className="message"
                id={username === messageContent.author ? "you" : "other"}
              >
                <div>
                  <div className="message-content">
                    <p>{messageContent.message}</p>
                    {messageContent.edited && <span>(edited)</span>}
                  </div>
                  <div className="message-meta">
                    <p id="time">{messageContent.time}</p>
                    <p id="author">{messageContent.author}</p>
                    {username === messageContent.author && (
                      <div className="message-options">
                        <button onClick={() => updateMessage(messageContent)}>
                          Edit
                        </button>
                        <ChakraProvider>
                          <AlertDialog
                            isOpen={isOpen}
                            leastDestructiveRef={cancelRef}
                            onClose={onClose}
                          >
                            <AlertDialogOverlay>
                              <AlertDialogContent>
                                <AlertDialogHeader
                                  fontSize="lg"
                                  fontWeight="bold"
                                >
                                  Delete Message
                                </AlertDialogHeader>
                                <AlertDialogBody>
                                  Are you sure? This action cannot be undone.
                                </AlertDialogBody>
                                <AlertDialogFooter>
                                  <Button ref={cancelRef} onClick={onClose}>
                                    Cancel
                                  </Button>
                                  <Button
                                    colorScheme="red"
                                    onClick={() => handleDelete(messageContent.id)}
                                    ml={3}
                                  >
                                    Delete
                                  </Button>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialogOverlay>
                          </AlertDialog>
                        </ChakraProvider>
                        <button onClick={() => confirmDelete(messageContent.id)}>
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </ScrollToBottom>
      </div>
      <div className="chat-footer">
        <input
          type="text"
          value={currentMessage}
          placeholder="Enter your message..."
          onChange={(event) => {
            setCurrentMessage(event.target.value);
          }}
          onKeyPress={(event) => {
            event.key === "Enter" && sendMessage();
          }}
        />
        <button onClick={sendMessage}>&#9658;</button>
      </div>
    </div>
    </ChakraProvider>
  );
}

export default Chat;
