import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  Dimensions,
  Modal,
  FlatList,
  Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUser } from '../api/auth'; // Adjust path as needed
import { getAIChatResponse } from '../api/aiadvise-api'; // Adjust path as needed

const { width, height } = Dimensions.get('window');

const AdviceScreen = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [activeMode, setActiveMode] = useState('ai'); // 'ai' or 'staff'
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showStaffTypePrompt, setShowStaffTypePrompt] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedStaffType, setSelectedStaffType] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [aiComparison, setAiComparison] = useState(null);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const chatsPerPage = 3;
  const scrollViewRef = useRef(null);
  const staffPromptRef = useRef(null);
  const inputFormRef = useRef(null);
  const navigation = useNavigation();

  // Check authentication status and load chat history
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        const storedHistory = await AsyncStorage.getItem('chatHistory');
        if (storedHistory) {
          setChatHistory(JSON.parse(storedHistory));
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
      }
    };

    const checkAuthStatus = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          setIsLoggedIn(false);
          return;
        }
        const response = await getCurrentUser(token);
        if (response.status === 200 && response.data?.data) {
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
          await AsyncStorage.removeItem('token');
        }
      } catch (error) {
        console.error('Auth check error:', error.response?.data || error.message);
        setIsLoggedIn(false);
        await AsyncStorage.removeItem('token');
      }
    };

    loadChatHistory();
    checkAuthStatus();
  }, []);

  // Auto-scroll to the latest message
  useEffect(() => {
    if (scrollViewRef.current && messages.length > 0) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  // Disable scrolling and trap focus when staff type prompt is shown
  useEffect(() => {
    if (showStaffTypePrompt) {
      staffPromptRef.current?.focus();
    }
  }, [showStaffTypePrompt]);

  // Handle message submission
  const handleSendMessage = async () => {
    if (!input.trim()) return;

    let currentChatId = selectedChatId;
    let storedHistory = chatHistory;

    // If no chat is selected, create a new chat
    if (currentChatId === null) {
      currentChatId = Date.now();
      const newChat = { id: currentChatId, question: input, messages: [] };
      storedHistory = [...chatHistory, newChat];
      setChatHistory(storedHistory);
      await AsyncStorage.setItem('chatHistory', JSON.stringify(storedHistory));
      setSelectedChatId(currentChatId);
      setCurrentPage(Math.ceil(storedHistory.length / chatsPerPage));
    }

    const userMessage = {
      id: messages.length + 1,
      text: input,
      sender: 'user',
      time: new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);
    setAiComparison(null);

    // Update chat history
    const updatedHistory = storedHistory.map((chat) =>
      chat.id === currentChatId
        ? { ...chat, question: chat.question || input, messages: updatedMessages }
        : chat
    );
    setChatHistory(updatedHistory);
    await AsyncStorage.setItem('chatHistory', JSON.stringify(updatedHistory));

    if (activeMode === 'ai') {
      try {
        const response = await getAIChatResponse(input);
        const aiMessage = {
          id: messages.length + 2,
          text: response.reply || 'Sorry, I could not process your request.',
          sender: 'ai',
          time: new Date().toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
        };
        const finalMessages = [...updatedMessages, aiMessage];
        setMessages(finalMessages);

        const newHistory = updatedHistory.map((chat) =>
          chat.id === currentChatId
            ? { ...chat, messages: finalMessages }
            : chat
        );
        setChatHistory(newHistory);
        await AsyncStorage.setItem('chatHistory', JSON.stringify(newHistory));
        setIsLoading(false);
      } catch (error) {
        console.error('Error sending message:', error.message);
        const errorMessage = {
          id: messages.length + 2,
          text: 'Error: Could not get a response from the server.',
          sender: 'ai',
          time: new Date().toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
        };
        const finalMessages = [...updatedMessages, errorMessage];
        setMessages(finalMessages);

        const newHistory = updatedHistory.map((chat) =>
          chat.id === currentChatId
            ? { ...chat, messages: finalMessages }
            : chat
        );
        setChatHistory(newHistory);
        await AsyncStorage.setItem('chatHistory', JSON.stringify(newHistory));
        setIsLoading(false);
      }
    } else {
      try {
        setTimeout(() => {
          const staffLabel = selectedStaffType === 'nutrition' ? 'Nutrition Staff' : 'Health Staff';
          const responseText = `${staffLabel} Response: Your question has been submitted to our team. Expect a reply soon!`;
          const staffMessage = {
            id: messages.length + 2,
            text: responseText,
            sender: 'staff',
            time: new Date().toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }),
            staffType: selectedStaffType,
          };
          const finalMessages = [...updatedMessages, staffMessage];
          setMessages(finalMessages);

          const newHistory = updatedHistory.map((chat) =>
            chat.id === currentChatId
              ? { ...chat, messages: finalMessages }
              : chat
          );
          setChatHistory(newHistory);
          AsyncStorage.setItem('chatHistory', JSON.stringify(newHistory));
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error submitting to staff:', error);
        const errorMessage = {
          id: messages.length + 2,
          text: 'Error: Could not submit your question. Please try again.',
          sender: 'staff',
          time: new Date().toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
          staffType: selectedStaffType,
        };
        const finalMessages = [...updatedMessages, errorMessage];
        setMessages(finalMessages);

        const newHistory = updatedHistory.map((chat) =>
          chat.id === currentChatId
            ? { ...chat, messages: finalMessages }
            : chat
        );
        setChatHistory(newHistory);
        await AsyncStorage.setItem('chatHistory', JSON.stringify(newHistory));
        setIsLoading(false);
      }
    }
  };

  // Compare to AI Chat
  const compareToAiChat = async () => {
    const lastUserMessage = messages.filter((msg) => msg.sender === 'user').slice(-1)[0];
    const lastStaffResponse = messages.filter((msg) => msg.sender === 'staff').slice(-1)[0];
    if (!lastUserMessage) return;

    setIsLoading(true);
    try {
      const response = await getAIChatResponse(lastUserMessage.text);
      setAiComparison({
        userMessage: lastUserMessage.text,
        aiResponse: response.reply || 'Sorry, I could not process your request.',
        staffResponse: lastStaffResponse ? lastStaffResponse.text : 'No staff response yet.',
        staffType: lastStaffResponse ? lastStaffResponse.staffType : selectedStaffType,
        time: new Date().toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
      });
      setIsLoading(false);
    } catch (error) {
      console.error('Error comparing to AI:', error.message);
      setAiComparison({
        userMessage: lastUserMessage.text,
        aiResponse: 'Error: Could not get AI response.',
        staffResponse: lastStaffResponse ? lastStaffResponse.text : 'No staff response yet.',
        staffType: lastStaffResponse ? lastStaffResponse.staffType : selectedStaffType,
        time: new Date().toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
      });
      setIsLoading(false);
    }
  };

  // Switch between AI and Staff modes
  const switchMode = (mode) => {
    if (mode === 'staff') {
      if (!isLoggedIn) {
        setShowLoginPrompt(true);
        return;
      }
      setShowStaffTypePrompt(true);
      return;
    }
    setActiveMode(mode);
    setMessages([]);
    setInput('');
    setAiComparison(null);
    setShowLoginPrompt(false);
    setShowStaffTypePrompt(false);
    setSelectedStaffType(null);
    setSelectedChatId(null);
    setCurrentPage(1);
  };

  // Handle staff type selection
  const handleStaffTypeSelect = (staffType) => {
    setSelectedStaffType(staffType);
    setActiveMode('staff');
    setMessages([]);
    setInput('');
    setAiComparison(null);
    setShowStaffTypePrompt(false);
    setShowLoginPrompt(false);
    setSelectedChatId(null);
    setCurrentPage(1);
  };

  // Start new chat
  const startNewChat = async () => {
    const newChat = { id: Date.now(), question: '', messages: [] };
    setMessages([]);
    setInput('');
    setAiComparison(null);
    setSelectedStaffType(null);
    setSelectedChatId(newChat.id);
    setChatHistory((prev) => {
      const newHistory = [...prev, newChat];
      AsyncStorage.setItem('chatHistory', JSON.stringify(newHistory));
      setCurrentPage(Math.ceil(newHistory.length / chatsPerPage));
      return newHistory;
    });
    setShowHistoryModal(false);
    // Scroll to input form
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  // Load chat history
  const loadChatHistory = (chatId) => {
    const chat = chatHistory.find((ch) => ch.id === chatId);
    if (chat) {
      setMessages(chat.messages || []);
      setSelectedChatId(chatId);
      setAiComparison(null);
      const lastStaffMessage = chat.messages.filter((msg) => msg.sender === 'staff').slice(-1)[0];
      setSelectedStaffType(lastStaffMessage ? lastStaffMessage.staffType : null);
      setActiveMode(lastStaffMessage ? 'staff' : 'ai');
      setShowHistoryModal(false);
      // Scroll to bottom of chat
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }
  };

  // Delete chat
  const deleteChat = async (chatId) => {
    const updatedHistory = chatHistory.filter((chat) => chat.id !== chatId);
    setChatHistory(updatedHistory);
    await AsyncStorage.setItem('chatHistory', JSON.stringify(updatedHistory));

    if (selectedChatId === chatId) {
      setMessages([]);
      setSelectedChatId(null);
      setAiComparison(null);
      setSelectedStaffType(null);
      setActiveMode('ai');
    }

    const newTotalPages = Math.ceil(updatedHistory.length / chatsPerPage);
    if (currentPage > newTotalPages && newTotalPages > 0) {
      setCurrentPage(newTotalPages);
    } else if (updatedHistory.length === 0) {
      setCurrentPage(1);
    }
  };

  // Pagination controls
  const totalPages = Math.ceil(chatHistory.length / chatsPerPage);
  const startIndex = (currentPage - 1) * chatsPerPage;
  const endIndex = startIndex + chatsPerPage;
  const currentChats = chatHistory.slice(startIndex, endIndex);

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.title}>
          {activeMode === 'ai' ? 'AI Advice Chat' : `${selectedStaffType === 'nutrition' ? 'Nutrition' : 'Health'} Staff Advice Chat`}
        </Text>
        <TouchableOpacity onPress={() => setShowHistoryModal(true)} style={styles.historyButton}>
          <Ionicons name="time-outline" size={24} color="#1a1a1a" />
        </TouchableOpacity>
      </View>
      <Text style={styles.description}>
        {activeMode === 'ai'
          ? 'Chat with our AI for instant pregnancy-related advice.'
          : `Get personalized guidance from our ${selectedStaffType === 'nutrition' ? 'nutrition' : 'health'} staff.`}
      </Text>

      {/* Mode Toggle */}
      <View style={styles.modeNav}>
        <TouchableOpacity
          style={[styles.modeButton, activeMode === 'ai' && styles.modeButtonActive]}
          onPress={() => switchMode('ai')}
        >
          <Text style={[styles.modeButtonText, activeMode === 'ai' && styles.modeButtonTextActive]}>
            AI Advice
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeButton, activeMode === 'staff' && styles.modeButtonActive, !isLoggedIn && styles.modeButtonDisabled]}
          onPress={() => switchMode('staff')}
          disabled={!isLoggedIn}
        >
          <Text style={[styles.modeButtonText, activeMode === 'staff' && styles.modeButtonTextActive]}>
            Staff Advice
          </Text>
        </TouchableOpacity>
      </View>

      {/* Chat Container */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.chatContainer}>
          {messages.length === 0 && (
            <Text style={styles.emptyMessage}>
              Start chatting by typing your question below!
            </Text>
          )}
          {messages.map((msg, index) => (
            <Animatable.View
              key={index}
              animation="fadeInUp"
              duration={300}
              style={[
                styles.message,
                msg.sender === 'user' ? styles.messageUser : msg.sender === 'ai' ? styles.messageBot : styles.messageStaff,
              ]}
            >
              {msg.sender === 'ai' && (
                <View style={styles.avatar} />
              )}
              <View
                style={[
                  styles.messageContent,
                  msg.sender === 'user'
                    ? styles.bgUser
                    : msg.sender === 'ai'
                    ? styles.bgAI
                    : styles.bgStaff,
                ]}
              >
                <Text style={[styles.messageText, msg.sender === 'user' && styles.messageTextUser]}>
                  {msg.text}
                </Text>
                <Text style={[styles.messageTimestamp, msg.sender === 'user' && styles.messageTimestampUser]}>
                  {msg.time}
                </Text>
              </View>
            </Animatable.View>
          ))}
          {isLoading && (
            <Animatable.View
              animation="fadeInUp"
              duration={300}
              style={[styles.message, activeMode === 'ai' ? styles.messageBot : styles.messageStaff]}
            >
              {activeMode === 'ai' && <View style={styles.avatar} />}
              <View style={[styles.messageContent, styles.typing]}>
                <View style={styles.dot} />
                <View style={[styles.dot, { animationDelay: '0.2s' }]} />
                <View style={[styles.dot, { animationDelay: '0.4s' }]} />
              </View>
            </Animatable.View>
          )}
        </View>

        {/* AI Comparison */}
        {aiComparison && (
          <Animatable.View animation="fadeInUp" duration={300} style={styles.comparisonContainer}>
            <Text style={styles.comparisonTitle}>Response Comparison</Text>
            <Text style={styles.comparisonQuestion}>
              <Text style={styles.comparisonQuestionLabel}>Question: </Text>
              {aiComparison.userMessage}
            </Text>
            <View style={styles.comparisonTable}>
              <View style={styles.comparisonRow}>
                <Text style={styles.comparisonHeader}>
                  {aiComparison.staffType === 'nutrition' ? 'Nutrition Staff Response' : 'Health Staff Response'}
                </Text>
                <View style={[styles.messageContent, styles.bgStaff]}>
                  <Text style={styles.messageText}>{aiComparison.staffResponse}</Text>
                  <Text style={styles.messageTimestamp}>{aiComparison.time}</Text>
                </View>
              </View>
              <View style={styles.comparisonRow}>
                <Text style={styles.comparisonHeader}>AI Response</Text>
                <View style={[styles.messageContent, styles.bgAI]}>
                  <Text style={styles.messageText}>{aiComparison.aiResponse}</Text>
                  <Text style={styles.messageTimestamp}>{aiComparison.time}</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setAiComparison(null)}
            >
              <Text style={styles.closeButtonText}>Close Comparison</Text>
            </TouchableOpacity>
          </Animatable.View>
        )}

        {/* Footer Note */}
        <Text style={styles.footerNote}>
          {activeMode === 'ai'
            ? 'Need a human touch? Try our '
            : 'Want instant answers? Check out our '}
          <Text
            style={styles.linkText}
            onPress={() => navigation.navigate('Consultation')}
          >
            Consultant Chat
          </Text>{' '}
          page.
        </Text>

        {/* Compare Button (Staff Mode) */}
        {activeMode === 'staff' && messages.length > 0 && (
          <TouchableOpacity
            style={[styles.compareButton, isLoading && styles.compareButtonDisabled]}
            onPress={compareToAiChat}
            disabled={isLoading}
          >
            <Text style={styles.compareButtonText}>Compare to AI Chat</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Input Form */}
      {(activeMode === 'ai' || (activeMode === 'staff' && isLoggedIn)) && (
        <View style={styles.inputForm}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask a question..."
            placeholderTextColor="#6B7280"
            multiline
            ref={inputFormRef}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!input.trim() || isLoading) && styles.sendButtonDisabled]}
            onPress={handleSendMessage}
            disabled={isLoading || !input.trim()}
          >
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {/* Login Prompt Modal */}
      <Modal
        visible={showLoginPrompt}
        transparent
        animationType="fade"
      >
        <View style={styles.overlay}>
          <Animatable.View animation="zoomIn" duration={300} style={styles.loginPopup}>
            <Text style={styles.popupText}>
              Please{' '}
              <Text
                style={styles.linkText}
                onPress={() => navigation.navigate('Login')}
              >
                log in
              </Text>{' '}
              to access Staff Advice.
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowLoginPrompt(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </Animatable.View>
        </View>
      </Modal>

      {/* Staff Type Prompt Modal */}
      <Modal
        visible={showStaffTypePrompt}
        transparent
        animationType="fade"
      >
        <View style={styles.overlay}>
          <Animatable.View
            animation="zoomIn"
            duration={300}
            style={styles.staffTypePopup}
            ref={staffPromptRef}
            accessibilityRole="dialog"
          >
            <Text style={styles.staffTypeTitle}>Let's Get Started!</Text>
            <Text style={styles.staffTypeMessage}>Who would you like to consult with today?</Text>
            <View style={styles.staffTypeButtons}>
              <TouchableOpacity
                style={styles.staffTypeButton}
                onPress={() => handleStaffTypeSelect('nutrition')}
              >
                <Text style={styles.staffTypeButtonText}>Nutrition Staff</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.staffTypeButton}
                onPress={() => handleStaffTypeSelect('health')}
              >
                <Text style={styles.staffTypeButtonText}>Health Staff</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.staffTypeCancel}
              onPress={() => setShowStaffTypePrompt(false)}
            >
              <Text style={styles.staffTypeCancelText}>Cancel</Text>
            </TouchableOpacity>
          </Animatable.View>
        </View>
      </Modal>

      {/* Chat History Modal */}
      <Modal
        visible={showHistoryModal}
        transparent
        animationType="slide"
      >
        <View style={styles.historyModal}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>Advice History</Text>
            <TouchableOpacity
              style={styles.closeHistoryButton}
              onPress={() => setShowHistoryModal(false)}
            >
              <Ionicons name="close" size={24} color="#1a1a1a" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.newChatButton}
            onPress={startNewChat}
          >
            <Text style={styles.newChatButtonText}>New Chat</Text>
          </TouchableOpacity>
          {chatHistory.length === 0 ? (
            <Text style={styles.emptyHistoryMessage}>No history yet.</Text>
          ) : (
            <FlatList
              data={currentChats}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <Animatable.View
                  animation="fadeInUp"
                  duration={300}
                  style={[styles.historyItem, selectedChatId === item.id && styles.historyItemSelected]}
                >
                  <Pressable
                    style={styles.historyContent}
                    onPress={() => loadChatHistory(item.id)}
                  >
                    <Text style={styles.historySender}>
                      {item.question || 'New Chat'}:
                    </Text>
                    <Text style={styles.historyText}>
                      {item.messages.length > 0 ? item.messages[item.messages.length - 1].text.slice(0, 50) + '...' : 'No messages yet'}
                    </Text>
                    <Text style={styles.historyTimestamp}>
                      {item.messages.length > 0
                        ? item.messages[item.messages.length - 1].time
                        : new Date(item.id).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                    </Text>
                  </Pressable>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => deleteChat(item.id)}
                  >
                    <Ionicons name="trash-outline" size={16} color="#ffffff" />
                  </TouchableOpacity>
                </Animatable.View>
              )}
            />
          )}
          {totalPages > 1 && (
            <View style={styles.pagination}>
              <TouchableOpacity
                style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
                onPress={goToPreviousPage}
                disabled={currentPage === 1}
              >
                <Ionicons name="chevron-back" size={14} color="#ffffff" />
                <Text style={styles.paginationButtonText}>Prev</Text>
              </TouchableOpacity>
              <Text style={styles.paginationInfo}>
                {currentPage}/{totalPages}
              </Text>
              <TouchableOpacity
                style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
                onPress={goToNextPage}
                disabled={currentPage === totalPages}
              >
                <Text style={styles.paginationButtonText}>Next</Text>
                <Ionicons name="chevron-forward" size={14} color="#ffffff" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  backButton: {
    padding: 8,
  },
  historyButton: {
    padding: 8,
  },
  title: {
    fontSize: width < 480 ? 20 : 24,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  description: {
    fontSize: width < 480 ? 14 : 16,
    color: '#666666',
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  modeNav: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  modeButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  modeButtonActive: {
    backgroundColor: '#0084ff',
    borderColor: '#0084ff',
  },
  modeButtonDisabled: {
    backgroundColor: '#f0f0f0',
    borderColor: '#d1d5db',
  },
  modeButtonText: {
    fontSize: width < 480 ? 12 : 14,
    fontWeight: '500',
    color: '#333333',
  },
  modeButtonTextActive: {
    color: '#ffffff',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  chatContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 12,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  emptyMessage: {
    textAlign: 'center',
    color: '#888888',
    fontSize: width < 480 ? 12 : 14,
    padding: 20,
    opacity: 0.7,
  },
  message: {
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  messageUser: {
    justifyContent: 'flex-end',
  },
  messageBot: {
    justifyContent: 'flex-start',
  },
  messageStaff: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0084ff', // Placeholder for avatar image
    marginRight: 8,
  },
  messageContent: {
    maxWidth: '75%',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
  },
  bgUser: {
    backgroundColor: '#0084ff',
    borderBottomRightRadius: 4,
  },
  bgAI: {
    backgroundColor: '#e6f0ff',
    borderBottomLeftRadius: 4,
  },
  bgStaff: {
    backgroundColor: '#d1fae5',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: width < 480 ? 12 : 14,
    color: '#1a1a1a',
  },
  messageTextUser: {
    color: '#ffffff',
  },
  messageTimestamp: {
    fontSize: width < 480 ? 10 : 12,
    color: '#999999',
    marginTop: 4,
    opacity: 0.8,
  },
  messageTimestampUser: {
    color: '#ffffff',
  },
  typing: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 8,
  },
  dot: {
    width: 6,
    height: 6,
    backgroundColor: '#666666',
    borderRadius: 3,
  },
  inputForm: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 8,
    marginHorizontal: 20,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  input: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: width < 480 ? 12 : 14,
    color: '#1a1a1a',
  },
  sendButton: {
    backgroundColor: '#0084ff',
    borderRadius: 50,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  footerNote: {
    fontSize: width < 480 ? 12 : 14,
    color: '#666666',
    textAlign: 'center',
    marginHorizontal: 20,
    marginTop: 12,
  },
  linkText: {
    color: '#0084ff',
    fontWeight: '500',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginPopup: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  popupText: {
    fontSize: width < 480 ? 14 : 16,
    color: '#333333',
    marginBottom: 20,
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: '#0084ff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: width < 480 ? 12 : 14,
    fontWeight: '500',
  },
  staffTypePopup: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  staffTypeTitle: {
    fontSize: width < 480 ? 18 : 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  staffTypeMessage: {
    fontSize: width < 480 ? 14 : 16,
    color: '#333333',
    marginBottom: 20,
    textAlign: 'center',
  },
  staffTypeButtons: {
    flexDirection: width < 480 ? 'column' : 'row',
    gap: 12,
    marginBottom: 20,
  },
  staffTypeButton: {
    backgroundColor: '#0084ff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    flex: 1,
  },
  staffTypeButtonText: {
    color: '#ffffff',
    fontSize: width < 480 ? 14 : 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  staffTypeCancel: {
    backgroundColor: '#e5e7eb',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  staffTypeCancelText: {
    color: '#333333',
    fontSize: width < 480 ? 12 : 14,
    fontWeight: '500',
  },
  compareButton: {
    backgroundColor: '#0084ff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignSelf: 'center',
    marginVertical: 12,
  },
  compareButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  compareButtonText: {
    color: '#ffffff',
    fontSize: width < 480 ? 12 : 14,
    fontWeight: '500',
  },
  comparisonContainer: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  comparisonTitle: {
    fontSize: width < 480 ? 16 : 18,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 12,
  },
  comparisonQuestion: {
    fontSize: width < 480 ? 14 : 16,
    color: '#333333',
    textAlign: 'center',
    marginBottom: 12,
  },
  comparisonQuestionLabel: {
    fontWeight: '600',
  },
  comparisonTable: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  comparisonRow: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  comparisonHeader: {
    fontSize: width < 480 ? 14 : 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  historyModal: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: height * 0.7,
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyTitle: {
    fontSize: width < 480 ? 18 : 20,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  closeHistoryButton: {
    padding: 8,
  },
  newChatButton: {
    backgroundColor: '#0084ff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginBottom: 12,
  },
  newChatButtonText: {
    color: '#ffffff',
    fontSize: width < 480 ? 12 : 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  emptyHistoryMessage: {
    textAlign: 'center',
    color: '#888888',
    fontSize: width < 480 ? 12 : 14,
    padding: 20,
    opacity: 0.7,
  },
  historyItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyItemSelected: {
    backgroundColor: '#e0e0e0',
  },
  historyContent: {
    flex: 1,
    paddingRight: 40,
  },
  historySender: {
    fontSize: width < 480 ? 14 : 16,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  historyText: {
    fontSize: width < 480 ? 12 : 14,
    color: '#333333',
    marginBottom: 4,
  },
  historyTimestamp: {
    fontSize: width < 480 ? 10 : 12,
    color: '#999999',
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ff4d4f',
    borderRadius: 14,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  paginationButton: {
    backgroundColor: '#ff4d4f',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  paginationButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  paginationButtonText: {
    color: '#ffffff',
    fontSize: width < 480 ? 10 : 12,
    fontWeight: '500',
  },
  paginationInfo: {
    fontSize: width < 480 ? 10 : 12,
    fontWeight: '500',
    color: '#1a1a1a',
    backgroundColor: '#ffffff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
});

export default AdviceScreen;