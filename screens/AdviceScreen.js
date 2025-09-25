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
  KeyboardAvoidingView,
  Keyboard, // Added Keyboard import
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAIChatResponse } from '../api/aiadvise-api'; // Adjust path as needed

const { width, height } = Dimensions.get('window');

const AdviceScreen = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [activeMode, setActiveMode] = useState('ai'); // 'ai' or 'staff'
  const [isLoading, setIsLoading] = useState(false);
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

  // Load chat history (matches AdvicePage's localStorage logic)
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
    loadChatHistory();
  }, []);

  // Auto-scroll to the latest message (equivalent to AdvicePage's scrollIntoView)
  useEffect(() => {
    if (scrollViewRef.current && messages.length > 0) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  // Handle message submission (matches AdvicePage's staff advice logic)
  const handleSendMessage = async () => {
    if (!input.trim()) return;

    let currentChatId = selectedChatId;
    let storedHistory = chatHistory;

    // Create new chat if none selected (same as AdvicePage)
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
    Keyboard.dismiss(); // Close the keyboard after sending the message
    setIsLoading(true);
    setAiComparison(null);

    // Update chat history (matches AdvicePage's localStorage update)
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
      // Staff advice logic (identical to AdvicePage)
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

  // Compare to AI Chat (matches AdvicePage's compareToAiChat)
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
      setShowStaffTypePrompt(true);
      return;
    }
    setActiveMode(mode);
    setMessages([]);
    setInput('');
    setAiComparison(null);
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
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            accessible
            accessibilityLabel="Go back"
            accessibilityRole="button"
            accessibilityHint="Return to previous screen"
          >
            <Ionicons name="arrow-back" size={28} color="#1a1a1a" />
          </TouchableOpacity>
          <Text style={styles.title}>
            {activeMode === 'ai' ? 'AI Advice Chat' : `${selectedStaffType === 'nutrition' ? 'Nutrition' : 'Health'} Staff Advice Chat`}
          </Text>
          <TouchableOpacity
            onPress={() => setShowHistoryModal(true)}
            style={styles.historyButton}
            accessible
            accessibilityLabel="View chat history"
            accessibilityRole="button"
            accessibilityHint="Open chat history view"
          >
            <Ionicons name="time-outline" size={28} color="#1a1a1a" />
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
            accessible
            accessibilityLabel="Switch to AI Advice"
            accessibilityRole="button"
            accessibilityHint="Switch to AI-powered advice chat"
          >
            <Text style={[styles.modeButtonText, activeMode === 'ai' && styles.modeButtonTextActive]}>
              AI Advice
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeButton, activeMode === 'staff' && styles.modeButtonActive]}
            onPress={() => switchMode('staff')}
            accessible
            accessibilityLabel="Switch to Staff Advice"
            accessibilityRole="button"
            accessibilityHint="Switch to staff advice chat"
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
          keyboardShouldPersistTaps="handled"
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
                accessible
                accessibilityLabel={`${msg.sender === 'user' ? 'Your message' : msg.sender === 'ai' ? 'AI response' : 'Staff response'}: ${msg.text}`}
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
          {/* AI Comparison (optimized for iOS) */}
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
                accessible
                accessibilityLabel="Close comparison"
                accessibilityRole="button"
                accessibilityHint="Close the response comparison view"
              >
                <Text style={styles.closeButtonText}>Close Comparison</Text>
              </TouchableOpacity>
            </Animatable.View>
          )}
          {/* Compare Button (Staff Mode) */}
          {activeMode === 'staff' && messages.length > 0 && (
            <TouchableOpacity
              style={[styles.compareButton, isLoading && styles.compareButtonDisabled]}
              onPress={compareToAiChat}
              disabled={isLoading}
              accessible
              accessibilityLabel="Compare to AI Chat"
              accessibilityRole="button"
              accessibilityHint="Compare staff response with AI response"
            >
              <Text style={styles.compareButtonText}>Compare to AI Chat</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
        {/* Input Form (same for AI and Staff modes) */}
        {(activeMode === 'ai' || activeMode === 'staff') && (
          <View style={styles.inputForm}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Ask a question..."
              placeholderTextColor="#6B7280"
              multiline
              ref={inputFormRef}
              accessible
              accessibilityLabel="Message input"
              accessibilityHint="Type your question here"
              returnKeyType="send"
              onSubmitEditing={handleSendMessage}
            />
            <TouchableOpacity
              style={[styles.sendButton, (!input.trim() || isLoading) && styles.sendButtonDisabled]}
              onPress={handleSendMessage}
              disabled={isLoading || !input.trim()}
              accessible
              accessibilityLabel="Send message"
              accessibilityRole="button"
              accessibilityHint="Send your question"
            >
              <Ionicons name="send" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
        {/* Staff Type Prompt Modal (iOS-optimized) */}
        <Modal
          visible={showStaffTypePrompt}
          transparent
          animationType="fade"
          onRequestClose={() => setShowStaffTypePrompt(false)}
        >
          <View style={styles.overlay}>
            <Animatable.View
              animation="zoomIn"
              duration={300}
              style={styles.staffTypePopup}
              ref={staffPromptRef}
              accessibilityRole="dialog"
              accessibilityLabel="Select staff type"
              accessibilityHint="Choose between Nutrition Staff or Health Staff"
            >
              <Text style={styles.staffTypeTitle}>Let's Get Started!</Text>
              <Text style={styles.staffTypeMessage}>Who would you like to consult with today?</Text>
              <View style={styles.staffTypeButtons}>
                <TouchableOpacity
                  style={styles.staffTypeButton}
                  onPress={() => handleStaffTypeSelect('nutrition')}
                  accessible
                  accessibilityLabel="Consult Nutrition Staff"
                  accessibilityRole="button"
                  accessibilityHint="Chat with nutrition experts"
                >
                  <Text style={styles.staffTypeButtonText}>Nutrition Staff</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.staffTypeButton}
                  onPress={() => handleStaffTypeSelect('health')}
                  accessible
                  accessibilityLabel="Consult Health Staff"
                  accessibilityRole="button"
                  accessibilityHint="Chat with health experts"
                >
                  <Text style={styles.staffTypeButtonText}>Health Staff</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.staffTypeCancel}
                onPress={() => setShowStaffTypePrompt(false)}
                accessible
                accessibilityLabel="Cancel staff selection"
                accessibilityRole="button"
                accessibilityHint="Close the staff selection dialog"
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
          onRequestClose={() => setShowHistoryModal(false)}
        >
          <SafeAreaView style={styles.historyModal} edges={['bottom', 'left', 'right']}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>Advice History</Text>
              <TouchableOpacity
                style={styles.closeHistoryButton}
                onPress={() => setShowHistoryModal(false)}
                accessible
                accessibilityLabel="Close history"
                accessibilityRole="button"
                accessibilityHint="Close the chat history view"
              >
                <Ionicons name="close" size={28} color="#1a1a1a" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.newChatButton}
              onPress={startNewChat}
              accessible
              accessibilityLabel="Start new chat"
              accessibilityRole="button"
              accessibilityHint="Begin a new chat session"
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
                      accessible
                      accessibilityLabel={`Chat: ${item.question || 'New Chat'}`}
                      accessibilityRole="button"
                      accessibilityHint="Load this chat session"
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
                      accessible
                      accessibilityLabel="Delete chat"
                      accessibilityRole="button"
                      accessibilityHint="Remove this chat from history"
                    >
                      <Ionicons name="trash-outline" size={20} color="#ffffff" />
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
                  accessible
                  accessibilityLabel="Previous page"
                  accessibilityRole="button"
                  accessibilityHint="Go to previous chat history page"
                >
                  <Ionicons name="chevron-back" size={16} color="#ffffff" />
                  <Text style={styles.paginationButtonText}>Prev</Text>
                </TouchableOpacity>
                <Text style={styles.paginationInfo}>
                  {currentPage}/{totalPages}
                </Text>
                <TouchableOpacity
                  style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
                  onPress={goToNextPage}
                  disabled={currentPage === totalPages}
                  accessible
                  accessibilityLabel="Next page"
                  accessibilityRole="button"
                  accessibilityHint="Go to next chat history page"
                >
                  <Text style={styles.paginationButtonText}>Next</Text>
                  <Ionicons name="chevron-forward" size={16} color="#ffffff" />
                </TouchableOpacity>
              </View>
            )}
          </SafeAreaView>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  backButton: {
    padding: 12,
    minWidth: 44,
    minHeight: 44, // iOS HIG: minimum tap target
  },
  historyButton: {
    padding: 12,
    minWidth: 44,
    minHeight: 44,
  },
  title: {
    fontSize: width < 360 ? 18 : width < 480 ? 20 : 22,
    fontWeight: '600',
    color: '#1a1a1a',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  description: {
    fontSize: width < 360 ? 12 : width < 480 ? 14 : 16,
    color: '#666666',
    textAlign: 'center',
    paddingHorizontal: 16,
    marginVertical: 12,
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  modeNav: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  modeButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    minWidth: 120,
    minHeight: 44, // iOS HIG: minimum tap target
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  modeButtonActive: {
    backgroundColor: '#007aff',
    borderColor: '#007aff',
    shadowOpacity: 0.2, // Enhanced shadow for active state on iOS
  },
  modeButtonText: {
    fontSize: width < 360 ? 14 : width < 480 ? 16 : 18,
    fontWeight: '600',
    color: '#333333',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  modeButtonTextActive: {
    color: '#ffffff',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    flexGrow: 1,
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
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  emptyMessage: {
    textAlign: 'center',
    color: '#888888',
    fontSize: width < 360 ? 12 : width < 480 ? 14 : 16,
    padding: 20,
    opacity: 0.7,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#007aff',
    marginRight: 8,
  },
  messageContent: {
    maxWidth: '75%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 18,
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
  bgUser: {
    backgroundColor: '#007aff',
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
    fontSize: width < 360 ? 14 : width < 480 ? 16 : 18,
    color: '#1a1a1a',
    lineHeight: 24,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  messageTextUser: {
    color: '#ffffff',
  },
  messageTimestamp: {
    fontSize: width < 360 ? 10 : width < 480 ? 12 : 14,
    color: '#999999',
    marginTop: 8,
    opacity: 0.8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  messageTimestampUser: {
    color: '#ffffff',
  },
  typing: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 10,
  },
  dot: {
    width: 8,
    height: 8,
    backgroundColor: '#666666',
    borderRadius: 4,
  },
  inputForm: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 8,
    marginHorizontal: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: width < 360 ? 14 : width < 480 ? 16 : 18,
    color: '#1a1a1a',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    minHeight: 48,
    maxHeight: 120,
  },
  sendButton: {
    backgroundColor: '#007aff',
    borderRadius: 50,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  footerNote: {
    fontSize: width < 360 ? 12 : width < 480 ? 14 : 16,
    color: '#666666',
    textAlign: 'center',
    marginHorizontal: 16,
    marginVertical: 12,
    lineHeight: 24,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  linkText: {
    color: '#007aff',
    fontWeight: '600',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  staffTypePopup: {
    backgroundColor: '#ffffff',
    padding: 24,
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
    fontSize: width < 360 ? 20 : width < 480 ? 22 : 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  staffTypeMessage: {
    fontSize: width < 360 ? 16 : width < 480 ? 18 : 20,
    color: '#333333',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 28,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  staffTypeButtons: {
    flexDirection: width < 360 ? 'column' : 'row',
    gap: 16,
    marginBottom: 24,
    width: '100%',
  },
  staffTypeButton: {
    backgroundColor: '#007aff',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    flex: 1,
    minHeight: 48,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  staffTypeButtonText: {
    color: '#ffffff',
    fontSize: width < 360 ? 16 : width < 480 ? 18 : 20,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  staffTypeCancel: {
    backgroundColor: '#e5e7eb',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 14,
    minWidth: 120,
    minHeight: 48,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  staffTypeCancelText: {
    color: '#333333',
    fontSize: width < 360 ? 14 : width < 480 ? 16 : 18,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  compareButton: {
    backgroundColor: '#007aff',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 14,
    alignSelf: 'center',
    marginVertical: 16,
    minHeight: 48,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  compareButtonDisabled: {
    backgroundColor: '#cccccc',
    opacity: 0.6,
    shadowOpacity: 0,
  },
  compareButtonText: {
    color: '#ffffff',
    fontSize: width < 360 ? 16 : width < 480 ? 18 : 20,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  comparisonContainer: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  comparisonTitle: {
    fontSize: width < 360 ? 18 : width < 480 ? 20 : 22,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  comparisonQuestion: {
    fontSize: width < 360 ? 14 : width < 480 ? 16 : 18,
    color: '#333333',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 24,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  comparisonQuestionLabel: {
    fontWeight: '600',
  },
  comparisonTable: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 16,
  },
  comparisonRow: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  comparisonHeader: {
    fontSize: width < 360 ? 16 : width < 480 ? 18 : 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  closeButton: {
    backgroundColor: '#ff3b30',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 14,
    alignSelf: 'center',
    minHeight: 48,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: width < 360 ? 16 : width < 480 ? 18 : 20,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  historyModal: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: height * 0.7,
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: 16,
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
    fontSize: width < 360 ? 20 : width < 480 ? 22 : 24,
    fontWeight: '700',
    color: '#1a1a1a',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  closeHistoryButton: {
    padding: 12,
    minWidth: 44,
    minHeight: 44,
  },
  newChatButton: {
    backgroundColor: '#007aff',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 14,
    marginBottom: 12,
    minHeight: 48,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  newChatButtonText: {
    color: '#ffffff',
    fontSize: width < 360 ? 16 : width < 480 ? 18 : 20,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  emptyHistoryMessage: {
    textAlign: 'center',
    color: '#888888',
    fontSize: width < 360 ? 14 : width < 480 ? 16 : 18,
    padding: 20,
    opacity: 0.7,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  historyItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  historyItemSelected: {
    backgroundColor: '#e0e0e0',
  },
  historyContent: {
    flex: 1,
    paddingRight: 40,
  },
  historySender: {
    fontSize: width < 360 ? 16 : width < 480 ? 18 : 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  historyText: {
    fontSize: width < 360 ? 14 : width < 480 ? 16 : 18,
    color: '#333333',
    marginBottom: 8,
    lineHeight: 24,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  historyTimestamp: {
    fontSize: width < 360 ? 12 : width < 480 ? 14 : 16,
    color: '#999999',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ff3b30',
    borderRadius: 16,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  paginationButton: {
    backgroundColor: '#ff3b30',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 48,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  paginationButtonDisabled: {
    backgroundColor: '#d1d5db',
    opacity: 0.6,
    shadowOpacity: 0,
  },
  paginationButtonText: {
    color: '#ffffff',
    fontSize: width < 360 ? 14 : width < 480 ? 16 : 18,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  paginationInfo: {
    fontSize: width < 360 ? 14 : width < 480 ? 16 : 18,
    fontWeight: '600',
    color: '#1a1a1a',
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
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