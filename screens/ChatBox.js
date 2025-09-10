import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { getAIChatResponse } from '../api/aiadvise-api'; // Adjust the import path

const ChatBox = ({ isOpen, onClose, navigation }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const chatAreaRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Load chat history from AsyncStorage
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        const storedHistory = JSON.parse(
          (await AsyncStorage.getItem('chatHistory')) || '[]'
        );
        setChatHistory(storedHistory);
        if (selectedChatId !== null) {
          const chat = storedHistory.find((ch) => ch.id === selectedChatId);
          if (chat) {
            setMessages(chat.messages || []);
          }
        } else if (storedHistory.length === 0) {
          const newChat = { id: Date.now(), question: '', messages: [] };
          storedHistory.push(newChat);
          await AsyncStorage.setItem('chatHistory', JSON.stringify(storedHistory));
          setChatHistory(storedHistory);
          setMessages([]);
          setSelectedChatId(newChat.id);
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
      }
    };
    loadChatHistory();

    // Animation for opening/closing
    Animated.timing(fadeAnim, {
      toValue: isOpen ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isOpen, selectedChatId]);

  // Scroll to the latest message
  useEffect(() => {
    if (chatAreaRef.current && messages.length > 0) {
      chatAreaRef.current.scrollToEnd({ animated: true });
    }
  }, [messages, isTyping]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    let currentChatId = selectedChatId;
    let storedHistory = JSON.parse(
      (await AsyncStorage.getItem('chatHistory')) || '[]'
    );

    if (currentChatId === null) {
      currentChatId = Date.now();
      const newChat = { id: currentChatId, question: newMessage, messages: [] };
      storedHistory.push(newChat);
      await AsyncStorage.setItem('chatHistory', JSON.stringify(storedHistory));
      setSelectedChatId(currentChatId);
      setChatHistory(storedHistory);
    }

    const userMsg = {
      id: messages.length + 1,
      text: newMessage,
      sender: 'user',
      time: new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setNewMessage('');
    setIsTyping(true);

    try {
      const response = await getAIChatResponse(newMessage);
      const systemMsg = {
        id: messages.length + 2,
        text: response.reply || 'Sorry, I could not process your request.',
        sender: 'system',
        time: new Date().toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
      };
      const finalMessages = [...updatedMessages, systemMsg];
      setMessages(finalMessages);

      storedHistory = JSON.parse(
        (await AsyncStorage.getItem('chatHistory')) || '[]'
      );
      const updatedHistory = storedHistory.map((chat) =>
        chat.id === currentChatId
          ? { ...chat, question: chat.question || newMessage, messages: finalMessages }
          : chat
      );
      await AsyncStorage.setItem('chatHistory', JSON.stringify(updatedHistory));
      setChatHistory(updatedHistory);
    } catch (error) {
      console.error('Error sending message:', error.message);
      const errorMsg = {
        id: messages.length + 2,
        text: 'Error: Could not get a response from the server.',
        sender: 'system',
        time: new Date().toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
      };
      const finalMessages = [...updatedMessages, errorMsg];
      setMessages(finalMessages);

      storedHistory = JSON.parse(
        (await AsyncStorage.getItem('chatHistory')) || '[]'
      );
      const updatedHistory = storedHistory.map((chat) =>
        chat.id === currentChatId
          ? { ...chat, question: chat.question || newMessage, messages: finalMessages }
          : chat
      );
      await AsyncStorage.setItem('chatHistory', JSON.stringify(updatedHistory));
      setChatHistory(updatedHistory);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.nativeEvent.key === 'Enter') {
      handleSendMessage();
    }
  };

  // Handle chat selection
  const handleSelectChat = (chatId) => {
    setSelectedChatId(Number(chatId));
  };

  // Handle navigation to AI Advice
  const handleNavigateToAIAdvice = () => {
    onClose(); // Close the chat box
    navigation.navigate('AIAdvice'); // Navigate to AdviceScreen
  };

  if (!isOpen) return null;

  return (
    <Animated.View style={[styles.chatboxContainer, { opacity: fadeAnim }]}>
      <View style={styles.chatboxHeader}>
        <View style={styles.chatboxAvatar} />
        <View style={styles.chatboxInfo}>
          <Text style={styles.chatboxInfoTitle}>Pregnancy Support</Text>
          <Text style={styles.chatboxStatus}>Online</Text>
        </View>
        <TouchableOpacity style={styles.chatboxClose} onPress={onClose}>
          <Ionicons name="close" size={16} color="#1c1e21" />
        </TouchableOpacity>
      </View>
      {chatHistory.length > 0 && (
        <View style={styles.chatboxChatSelect}>
          <Picker
            selectedValue={selectedChatId?.toString() || ''}
            onValueChange={(itemValue) => handleSelectChat(itemValue)}
            style={styles.chatboxChatDropdown}
          >
            <Picker.Item label="Select a chat" value="" enabled={false} />
            {chatHistory.map((chat) => (
              <Picker.Item
                key={chat.id}
                label={
                  chat.question || 'New Chat' + ' - ' +
                  (chat.messages.length > 0
                    ? chat.messages[chat.messages.length - 1].text.slice(0, 20) + '...'
                    : 'No messages')
                }
                value={chat.id.toString()}
              />
            ))}
          </Picker>
        </View>
      )}
      <ScrollView
        style={styles.chatboxArea}
        ref={chatAreaRef}
        contentContainerStyle={styles.chatboxAreaContent}
      >
        {messages.length === 0 && selectedChatId === null && chatHistory.length === 0 && (
          <View style={styles.chatboxWelcome}>
            <Text style={styles.chatboxWelcomeText}>
              Hello! Welcome to Pregnancy Support. Send a message to start.
            </Text>
          </View>
        )}
        {messages.map((msg) => (
          <View
            key={msg.id}
            style={[
              styles.chatboxMessage,
              msg.sender === 'user' ? styles.userMessage : styles.systemMessage,
            ]}
          >
            <View
              style={[
                styles.chatboxBubble,
                msg.sender === 'user' ? styles.userMessageBubble : styles.systemMessageBubble,
              ]}
            >
              <Text
                style={[
                  styles.chatboxBubbleText,
                  msg.sender === 'user' ? styles.userMessageText : styles.systemMessageText,
                ]}
              >
                {msg.text}
              </Text>
              <Text
                style={[
                  styles.chatboxTime,
                  msg.sender === 'user' ? styles.userTime : styles.systemTime,
                ]}
              >
                {msg.time}
              </Text>
            </View>
          </View>
        ))}
        {isTyping && (
          <View style={[styles.chatboxMessage, styles.systemMessage, styles.typingMessage]}>
            <View style={styles.chatboxBubbleTyping}>
              <View style={styles.chatboxTypingIndicator}>
                <View style={styles.typingDot} />
                <View style={[styles.typingDot, styles.typingDotDelay1]} />
                <View style={[styles.typingDot, styles.typingDotDelay2]} />
              </View>
            </View>
          </View>
        )}
      </ScrollView>
      <View style={styles.chatboxInputArea}>
        <TextInput
          style={styles.chatboxInput}
          value={newMessage}
          onChangeText={setNewMessage}
          onSubmitEditing={handleSendMessage}
          placeholder="Type a message..."
          placeholderTextColor="#65676b"
          returnKeyType="send"
        />
        <TouchableOpacity
          style={[styles.chatboxSendButton, !newMessage.trim() && styles.disabledButton]}
          onPress={handleSendMessage}
          disabled={!newMessage.trim()}
        >
          <Ionicons name="send" size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>
      <View style={styles.chatboxFooterNote}>
        <Text style={styles.chatboxFooterText}>
          More Function? Try our{' '}
          <Text
            style={styles.chatboxLink}
            onPress={handleNavigateToAIAdvice}
          >
            Advise Chat
          </Text>{' '}
          page.
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  chatboxContainer: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    width: 300,
    height: 400,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
      },
      android: {
        elevation: 5,
      },
    }),
    zIndex: 550,
  },
  chatboxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#f9fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  chatboxAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#867dec',
    marginRight: 8,
  },
  chatboxInfo: {
    flex: 1,
  },
  chatboxInfoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1c1e21',
  },
  chatboxStatus: {
    fontSize: 10,
    color: '#00d400',
    fontWeight: '500',
  },
  chatboxClose: {
    padding: 4,
    borderRadius: 12,
  },
  chatboxChatSelect: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f9fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  chatboxChatDropdown: {
    fontSize: 14,
    color: '#1c1e21',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  chatboxArea: {
    flex: 1,
    backgroundColor: '#f0f2f5',
    padding: 12,
  },
  chatboxAreaContent: {
    flexGrow: 1,
    paddingBottom: 10,
  },
  chatboxWelcome: {
    alignItems: 'center',
    padding: 15,
  },
  chatboxWelcomeText: {
    fontSize: 14,
    color: '#65676b',
    opacity: 0.8,
    textAlign: 'center',
  },
  chatboxMessage: {
    marginBottom: 6,
    maxWidth: '85%',
  },
  systemMessage: {
    alignSelf: 'flex-start',
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  chatboxBubble: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  systemMessageBubble: {
    backgroundColor: '#e4e6eb',
    borderBottomLeftRadius: 4,
  },
  userMessageBubble: {
    backgroundColor: '#0084ff',
    borderBottomRightRadius: 4,
  },
  chatboxBubbleText: {
    fontSize: 14,
    lineHeight: 18,
  },
  systemMessageText: {
    color: '#1c1e21',
  },
  userMessageText: {
    color: '#fff',
  },
  chatboxBubbleTyping: {
    backgroundColor: 'transparent',
    padding: 0,
  },
  chatboxTime: {
    fontSize: 10,
    marginTop: 3,
    textAlign: 'right',
    opacity: 0.8,
  },
  systemTime: {
    color: '#999',
  },
  userTime: {
    color: '#fff',
  },
  chatboxTypingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  typingDot: {
    width: 6,
    height: 6,
    backgroundColor: '#65676b',
    borderRadius: 3,
    marginHorizontal: 2,
  },
  typingDotDelay1: {
    // For animation delay - this would need Animated API for actual effect
  },
  typingDotDelay2: {
    // For animation delay - this would need Animated API for actual effect
  },
  typingMessage: {
    // Additional styling for typing indicator if needed
  },
  chatboxInputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    backgroundColor: '#ffffff',
  },
  chatboxInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    fontSize: 15,
    backgroundColor: '#f0f2f5',
    borderRadius: 18,
    marginRight: 8,
    color: '#1c1e21',
  },
  chatboxSendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0084ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  chatboxFooterNote: {
    padding: 8,
    alignItems: 'center',
  },
  chatboxFooterText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  chatboxLink: {
    color: '#0084ff',
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
});

export default ChatBox;