import React, { createContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
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
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [authData, setAuthData] = useState({ userId: null, token: null });
  
  const connectionRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const authCheckIntervalRef = useRef(null);

  const addMessage = useCallback((msg) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  // Monitor AsyncStorage for authentication data
  useEffect(() => {
    const checkAuthData = async () => {
      try {
        const userId = await AsyncStorage.getItem('userId');
        const token = await AsyncStorage.getItem('authToken');
        
        // Only update state if data has actually changed
        if (userId !== authData.userId || token !== authData.token) {
          console.log('Auth data updated:', { userId: !!userId, token: !!token });
          setAuthData({ userId, token });
        }
      } catch (error) {
        console.error('Error checking auth data:', error);
      }
    };

    // Check immediately
    checkAuthData();

    // Set up periodic checking for auth data
    authCheckIntervalRef.current = setInterval(checkAuthData, 2000);

    return () => {
      if (authCheckIntervalRef.current) {
        clearInterval(authCheckIntervalRef.current);
      }
    };
  }, [authData.userId, authData.token]);

  // Handle app state changes (foreground/background)
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'active' && connectionRef.current) {
        // App came to foreground, check connection
        if (connectionRef.current.state === signalR.HubConnectionState.Disconnected) {
          console.log('App became active, attempting to reconnect...');
          startConnection();
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);

  // Create and manage SignalR connection
  const startConnection = useCallback(async () => {
    const { userId, token } = authData;

    if (!userId || !token) {
      console.warn('No userId or authToken available, waiting...');
      setConnectionError('Authentication required. Please sign in.');
      setConnectionStatus('disconnected');
      return;
    }

    // Clean up existing connection
    if (connectionRef.current) {
      console.log('Cleaning up existing connection');
      try {
        await connectionRef.current.stop();
      } catch (error) {
        console.error('Error stopping existing connection:', error);
      }
      connectionRef.current = null;
      setConnection(null);
    }

    try {
      const baseUrl = apiClient.defaults.baseURL;
      if (!baseUrl) {
        console.error('apiClient baseURL is not defined');
        setConnectionError('Server URL not configured.');
        setConnectionStatus('disconnected');
        return;
      }

      const hubUrl = `${baseUrl}/hub/messageHub?userId=${userId}`;
      console.log('Creating SignalR connection to:', hubUrl);

      const newConnection = new signalR.HubConnectionBuilder()
        .withUrl(hubUrl, {
          accessTokenFactory: () => token,
          transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.ServerSentEvents,
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000, 30000]) // Enhanced retry intervals
        .configureLogging(signalR.LogLevel.Information)
        .build();

      connectionRef.current = newConnection;

      // Message handler
      newConnection.on('ReceivedMessage', (msg) => {
        console.log('Message received:', msg);
        console.log('Payload received:', msg?.payload);
        
        if (msg?.payload) {
          addMessage(msg.payload);
        } else {
          addMessage(msg);
        }
      });

      // Enhanced connection state handlers
      newConnection.onclose((error) => {
        console.error('SignalR connection closed:', error);
        setConnectionError('Connection closed. Attempting to reconnect...');
        setConnectionStatus('disconnected');
        setIsReconnecting(false);
        setConnection(null);
        
        // Attempt manual reconnection after automatic attempts fail
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('Attempting manual reconnection after connection close...');
          startConnection();
        }, 10000);
      });

      newConnection.onreconnecting((error) => {
        console.warn('SignalR reconnecting:', error);
        setConnectionError('Reconnecting to server...');
        setConnectionStatus('reconnecting');
        setIsReconnecting(true);
      });

      newConnection.onreconnected((connectionId) => {
        console.log('SignalR reconnected:', connectionId);
        setConnectionError(null);
        setConnectionStatus('connected');
        setIsReconnecting(false);
        
        // Clear any pending reconnection attempts
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      });

      // Start connection
      setConnectionStatus('connecting');
      await newConnection.start();
      
      console.log('MessageHub connected successfully, connectionId:', newConnection.connectionId);
      setConnection(newConnection);
      setConnectionError(null);
      setConnectionStatus('connected');
      
    } catch (err) {
      console.error('Failed to connect to MessageHub:', err);
      setConnectionError(`Failed to connect: ${err.message}`);
      setConnectionStatus('disconnected');
      
      // Retry connection after delay
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log('Retrying connection after error...');
        startConnection();
      }, 5000);
    }
  }, [authData, addMessage]);

  // Start connection when auth data becomes available
  useEffect(() => {
    if (authData.userId && authData.token) {
      console.log('Auth data available, starting connection...');
      startConnection();
    } else {
      console.log('Auth data not available yet, waiting...');
      setConnectionStatus('disconnected');
      setConnectionError('Waiting for authentication...');
    }

    return () => {
      if (connectionRef.current) {
        connectionRef.current
          .stop()
          .catch((err) => console.error('Error stopping MessageHub on cleanup:', err));
        connectionRef.current = null;
      }
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [authData.userId, authData.token, startConnection]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (authCheckIntervalRef.current) {
        clearInterval(authCheckIntervalRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  const contextValue = useMemo(
    () => ({
      connection,
      messages,
      addMessage,
      connectionError,
      connectionStatus,
      isReconnecting,
      isConnected: connectionStatus === 'connected',
      userId: authData.userId,
      forceReconnect: startConnection,
    }),
    [connection, messages, addMessage, connectionError, connectionStatus, isReconnecting, authData.userId, startConnection]
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
