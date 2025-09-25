// src/contexts/MessageContext.jsx
import React, {
  createContext,
  useEffect,
  useState,
  useRef,
  useMemo,
  useCallback,
} from "react";
import * as signalR from "@microsoft/signalr";
import apiClient from "../api/url-api";

export const MessageContext = createContext();

export const MessageProvider = ({ children }) => {
  const [connection, setConnection] = useState(null); // Change to state
  const [messages, setMessages] = useState([]);

  const addMessage = useCallback((msg) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    const baseUrl = apiClient.defaults.baseURL;
    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${baseUrl}/hub/messageHub?userId=${userId}`, {
        withCredentials: true,
      })
      .withAutomaticReconnect()
      .build();

    newConnection.on("ReceivedMessage", (msg) => {
      console.log("Message received:", msg);
      console.log("payload received:", msg?.payload);
      if (msg?.payload) {
        addMessage(msg.payload);
      } else {
        addMessage(msg);
      }
    });

    newConnection
      .start()
      .then(() => {
        console.log("MessageHub connected");
        setConnection(newConnection);
      })
      .catch((err) => {
        console.error("Failed to connect to MessageHub:", err.message);
      });

    return () => {
      newConnection
        .stop()
        .catch((err) => console.error("Error stopping MessageHub:", err));
    };
  }, [addMessage]);

  const contextValue = useMemo(() => ({
    connection, // Now this will be the actual connection object
    messages,
    addMessage,
  }), [connection, messages, addMessage]);

  return (
    <MessageContext.Provider value={contextValue}>
      {children}
    </MessageContext.Provider>
  );
};
