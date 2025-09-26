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
  KeyboardAvoidingView,
  SafeAreaView,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { getAIChatResponse } from '../api/aiadvise-api'; // Adjust the import path

const ChatBox = ({ isOpen, onClose, navigation }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [isChatPickerOpen, setIsChatPickerOpen] = useState(false);
  const chatAreaRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(100)).current;

  // Load chat history
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
          setSelectedChatId(newChat.id);
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
      }
    };
    loadChatHistory();

    // Animation for opening/closing
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: isOpen ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: isOpen ? 0 : 100,
        tension: 80,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isOpen, selectedChatId]);

  // Scroll to latest message
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

  const handleSelectChat = (chatId) => {
    setSelectedChatId(Number(chatId));
    setIsChatPickerOpen(false);
  };

  const handleNavigateToAIAdvice = () => {
    onClose();
    navigation.navigate('AIAdvice');
  };

  if (!isOpen) return null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0} // Adjusted for iOS header and safe area
      >
        <Animated.View
          style={[
            styles.chatboxContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.chatboxHeader}>
            <View style={styles.chatboxAvatar} />
            <View style={styles.chatboxInfo}>
              <Text style={styles.chatboxInfoTitle}>Pregnancy Support</Text>
              <Text style={styles.chatboxStatus}>Online</Text>
            </View>
            <TouchableOpacity
              style={styles.chatboxClose}
              onPress={onClose}
              accessibilityLabel="Close chat"
              accessibilityHint="Closes the chat window"
            >
              <Ionicons name="close" size={20} color="#1c1e21" />
            </TouchableOpacity>
          </View>
          {chatHistory.length > 0 && (
            <TouchableOpacity
              style={styles.chatboxChatSelect}
              onPress={() => setIsChatPickerOpen(true)}
              accessibilityLabel="Select previous chat"
              accessibilityHint="Opens a list of previous chat sessions"
            >
              <Text style={styles.chatboxChatSelectText}>
                {chatHistory.find((chat) => chat.id === selectedChatId)?.question ||
                  'Select a chat'}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#1c1e21" />
            </TouchableOpacity>
          )}
          <Modal
            visible={isChatPickerOpen}
            transparent
            animationType="slide"
            onRequestClose={() => setIsChatPickerOpen(false)}
          >
            <TouchableWithoutFeedback onPress={() => setIsChatPickerOpen(false)}>
              <View style={styles.modalOverlay}>
                <View style={styles.chatPickerModal}>
                  <ScrollView contentContainerStyle={styles.chatPickerContent}>
                    {chatHistory.map((chat) => (
                      <TouchableOpacity
                        key={chat.id}
                        style={styles.chatPickerItem}
                        onPress={() => handleSelectChat(chat.id)}
                        accessibilityLabel={`Select chat: ${chat.question || 'New Chat'}`}
                      >
                        <Text style={styles.chatPickerItemText}>
                          {chat.question || 'New Chat'} -{' '}
                          {chat.messages.length > 0
                            ? chat.messages[chat.messages.length - 1].text.slice(0, 20) + '...'
                            : 'No messages'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  <TouchableOpacity
                    style={styles.chatPickerClose}
                    onPress={() => setIsChatPickerOpen(false)}
                    accessibilityLabel="Close chat picker"
                  >
                    <Text style={styles.chatPickerCloseText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
          <ScrollView
            style={styles.chatboxArea}
            ref={chatAreaRef}
            contentContainerStyle={styles.chatboxAreaContent}
            keyboardShouldPersistTaps="handled"
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
              <View style={[styles.chatboxMessage, styles.systemMessage]}>
                <View style={styles.chatboxBubbleTyping}>
                  <Animated.View style={styles.typingDot} />
                  <Animated.View style={[styles.typingDot, styles.typingDotDelay1]} />
                  <Animated.View style={[styles.typingDot, styles.typingDotDelay2]} />
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
              placeholderTextColor="#8E8E93"
              returnKeyType="send"
              multiline
              accessibilityLabel="Message input"
              accessibilityHint="Type your message here"
            />
            <TouchableOpacity
              style={[styles.chatboxSendButton, !newMessage.trim() && styles.disabledButton]}
              onPress={handleSendMessage}
              disabled={!newMessage.trim()}
              accessibilityLabel="Send message"
              accessibilityHint="Sends the typed message"
            >
              <Ionicons name="send" size={24} color="#fff" />
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  chatboxContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 320,
    height: 450,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  chatboxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F2F2F7',
    borderBottomWidth: 0.5,
    borderBottomColor: '#C7C7CC',
  },
  chatboxAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#5856D6',
    marginRight: 12,
  },
  chatboxInfo: {
    flex: 1,
  },
  chatboxInfoTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    fontFamily: 'System',
  },
  chatboxStatus: {
    fontSize: 13,
    color: '#34C759',
    fontWeight: '500',
  },
  chatboxClose: {
    padding: 8,
    borderRadius: 20,
  },
  chatboxChatSelect: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#F2F2F7',
    borderBottomWidth: 0.5,
    borderBottomColor: '#C7C7CC',
  },
  chatboxChatSelectText: {
    fontSize: 15,
    color: '#000',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  chatPickerModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: '50%',
  },
  chatPickerContent: {
    paddingBottom: 16,
  },
  chatPickerItem: {
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#C7C7CC',
  },
  chatPickerItemText: {
    fontSize: 17,
    color: '#000',
  },
  chatPickerClose: {
    padding: 16,
    alignItems: 'center',
  },
  chatPickerCloseText: {
    fontSize: 17,
    color: '#007AFF',
    fontWeight: '600',
  },
  chatboxArea: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    padding: 16,
  },
  chatboxAreaContent: {
    flexGrow: 1,
    paddingBottom: 16,
  },
  chatboxWelcome: {
    alignItems: 'center',
    padding: 20,
  },
  chatboxWelcomeText: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    fontFamily: 'System',
  },
  chatboxMessage: {
    marginBottom: 12,
    maxWidth: '80%',
  },
  systemMessage: {
    alignSelf: 'flex-start',
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  chatboxBubble: {
    padding: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  systemMessageBubble: {
    backgroundColor: '#E5E5EA',
    borderBottomLeftRadius: 4,
  },
  userMessageBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  chatboxBubbleText: {
    fontSize: 17,
    lineHeight: 22,
    fontFamily: 'System',
  },
  systemMessageText: {
    color: '#000',
  },
  userMessageText: {
    color: '#fff',
  },
  chatboxBubbleTyping: {
    flexDirection: 'row',
    padding: 8,
  },
  typingDot: {
    width: 8,
    height: 8,
    backgroundColor: '#8E8E93',
    borderRadius: 4,
    marginHorizontal: 2,
  },
  typingDotDelay1: {
    // Add animation via Animated API if desired
  },
  typingDotDelay2: {
    // Add animation via Animated API if desired
  },
  chatboxTime: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'right',
    opacity: 0.6,
    fontFamily: 'System',
  },
  systemTime: {
    color: '#000',
  },
  userTime: {
    color: '#fff',
  },
  chatboxInputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 0.5,
    borderTopColor: '#C7C7CC',
    backgroundColor: '#fff',
  },
  chatboxInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    fontSize: 17,
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    marginRight: 12,
    color: '#000',
    fontFamily: 'System',
    maxHeight: 100,
  },
  chatboxSendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#C7C7CC',
  },
  chatboxFooterNote: {
    padding: 12,
    alignItems: 'center',
  },
  chatboxFooterText: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    fontFamily: 'System',
  },
  chatboxLink: {
    color: '#007AFF',
    fontWeight: '600',
  },
});

export default ChatBox;