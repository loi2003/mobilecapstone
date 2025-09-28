import React, { createContext, useEffect, useState, useCallback, useMemo } from 'react';
import * as signalR from '@microsoft/signalr';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api/url-api';

// Workaround for SignalR in React Native
if (!globalThis.document) {
  globalThis.document = undefined;
}

export const MessageContext = createContext();

export const MessageProvider = ({ children }) => {
  const [connection, setConnection] = useState(null);
  const [messages, setMessages] = useState([]);
  const [connectionError, setConnectionError] = useState(null);

  const addMessage = useCallback((msg) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  useEffect(() => {
    const startConnection = async () => {
      try {
        const userId = await AsyncStorage.getItem('userId');
        const token = await AsyncStorage.getItem('authToken');
        if (!userId || !token) {
          console.warn('No userId or authToken found in AsyncStorage');
          setConnectionError('Authentication required. Please sign in.');
          return;
        }

        const baseUrl = apiClient.defaults.baseURL;
        if (!baseUrl) {
          console.error('apiClient baseURL is not defined');
          setConnectionError('Server URL not configured.');
          return;
        }

        const hubUrl = `${baseUrl}/hub/messageHub?userId=${userId}`;
        console.log('Connecting to SignalR hub:', hubUrl);

        const newConnection = new signalR.HubConnectionBuilder()
          .withUrl(hubUrl, {
            accessTokenFactory: () => token,
            transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.ServerSentEvents,
          })
          .withAutomaticReconnect([0, 2000, 5000, 10000])
          .configureLogging(signalR.LogLevel.Information)
          .build();

        newConnection.on('ReceivedMessage', (msg) => {
          console.log('Message received:', msg);
          console.log('Payload received:', msg?.payload);
          if (msg?.payload) {
            addMessage(msg.payload);
          } else {
            addMessage(msg);
          }
        });

        newConnection.onclose((error) => {
          console.error('SignalR connection closed:', error);
          setConnectionError('SignalR connection closed. Retrying...');
        });

        newConnection.onreconnecting((error) => {
          console.warn('SignalR reconnecting:', error);
          setConnectionError('Reconnecting to server...');
        });

        newConnection.onreconnected((connectionId) => {
          console.log('SignalR reconnected:', connectionId);
          setConnectionError(null);
        });

        await newConnection.start();
        console.log('MessageHub connected, connectionId:', newConnection.connectionId);
        setConnection(newConnection);
        setConnectionError(null);
      } catch (err) {
        console.error('Failed to connect to MessageHub:', err);
        setConnectionError(`Failed to connect: ${err.message}`);
      }
    };

    startConnection();

    return () => {
      if (connection) {
        connection
          .stop()
          .catch((err) => console.error('Error stopping MessageHub:', err));
      }
    };
  }, [addMessage]);

  const contextValue = useMemo(
    () => ({
      connection,
      messages,
      addMessage,
      connectionError,
    }),
    [connection, messages, addMessage, connectionError]
  );

  return (
    <MessageContext.Provider value={contextValue}>
      {children}
    </MessageContext.Provider>
  );
};

export const useMessages = () => {
  const context = React.useContext(MessageContext);
  if (!context) {
    throw new Error('useMessages must be used within a MessageProvider');
  }
  return context;
};