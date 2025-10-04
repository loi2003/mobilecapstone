import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Platform,
  Dimensions,
  Modal,
  FlatList,
  Pressable,
  KeyboardAvoidingView,
  Keyboard,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as Animatable from "react-native-animatable";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import * as signalR from "@microsoft/signalr";
import { getAIChatResponse } from "../api/aiadvise-api";
import {
  startChatThread,
  getChatThreadByUserId,
  getChatThreadById,
} from "../api/message-api";
import { getAllUsers } from "../api/user-api";
import { getCurrentUser } from "../api/auth";
import { useMessages } from "../contexts/MessageContext";

if (!globalThis.document) {
  globalThis.document = undefined;
}

const { width, height } = Dimensions.get("window");

const AdviceScreen = () => {
  const { connection, messages: contextMessages, addMessage, connectionError } =
    useMessages();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [activeMode, setActiveMode] = useState("ai");
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserId, setCurrentUserId] = useState("");
  const [token, setToken] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [staffMembers, setStaffMembers] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showStaffSelection, setShowStaffSelection] = useState(false);
  const [staffChatThread, setStaffChatThread] = useState(null);
  const [staffMessages, setStaffMessages] = useState([]);
  const [aiMessages, setAiMessages] = useState([]);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const chatsPerPage = 3;

  const processedMessageIds = useRef(new Set());
  const scrollViewRef = useRef(null);
  const navigation = useNavigation();

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      const storedToken = await AsyncStorage.getItem("authToken");
      if (!storedToken) {
        Alert.alert("Error", "Please login first");
        navigation.navigate("SignIn", { redirectTo: "Advice", params: {} });
        return;
      }

      setToken(storedToken);
      const userRes = await getCurrentUser(storedToken);
      const userId =
        userRes?.data?.data?.id || userRes?.data?.id || userRes?.id || "";

      if (!userId) {
        await AsyncStorage.removeItem("authToken");
        navigation.navigate("SignIn", { redirectTo: "Advice", params: {} });
        return;
      }

      await AsyncStorage.setItem("userId", userId);
      setCurrentUserId(userId);
      setCurrentUser({ id: userId, ...userRes?.data?.data });

      await loadExistingMessages();
      await loadChatHistory();

      await loadStaffMembers(storedToken);
      setIsInitialized(true);
    } catch (error) {
      console.error("Initialization error:", error);
      Alert.alert("Error", "Failed to initialize app");
    }
  };

  const loadChatHistory = async () => {
    try {
      const storedHistory = await AsyncStorage.getItem("chatHistory");
      if (storedHistory) {
        const history = JSON.parse(storedHistory);
        setChatHistory(history);
        if (selectedChatId) {
          const chat = history.find((ch) => ch.id === selectedChatId);
          if (chat && activeMode === "ai") {
            setAiMessages(chat.messages || []);
            setMessages(chat.messages || []);
          }
        }
      }
    } catch (error) {
      console.error("Error loading chat history:", error);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const loadStaffMembers = async (authToken) => {
    try {
      const response = await getAllUsers(authToken);
      const users = response.data?.data || response.data || [];
      const staff = users
        .filter((user) => user.roleId === 4 || user.roleId === 3)
        .map((user) => ({
          ...user,
          type: user.roleId === 4 ? "nutrition" : "health",
          displayName: user.userName || `Staff ${user.id?.slice(0, 8)}`,
        }));

      setStaffMembers(staff);
      console.log("Loaded staff members:", staff.length);
    } catch (error) {
      console.error("Failed to load staff members:", error);
    }
  };

  const selectStaff = async (staff) => {
    try {
      setSelectedStaff(staff);
      setShowStaffSelection(false);
      await initializeStaffThread(staff);
      setActiveMode("staff"); // Switch to staff mode
      setMessages(staffMessages); // Update messages to show staff chat
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (error) {
      console.error("Failed to select staff:", error);
      Alert.alert("Error", "Failed to connect with staff member");
    }
  };

  const initializeStaffThread = async (staff) => {
    try {
      if (!currentUserId || !token) return;

      console.log("Initializing staff thread for:", staff.displayName);
      const threadsResponse = await getChatThreadByUserId(currentUserId, token);
      let threads = [];

      if (Array.isArray(threadsResponse)) {
        threads = threadsResponse;
      } else if (threadsResponse?.data && Array.isArray(threadsResponse.data)) {
        threads = threadsResponse.data;
      } else if (threadsResponse?.id && threadsResponse?.consultantId) {
        threads = [threadsResponse];
      }

      const existingThread = threads.find(
        (thread) =>
          thread.consultantId === staff.id ||
          (thread.userId === currentUserId && thread.consultantId === staff.id)
      );

      if (existingThread) {
        console.log("Loading existing thread:", existingThread.id);
        setStaffChatThread(existingThread);
        await loadThreadMessages(existingThread);

        if (
          connection &&
          connection.state === signalR.HubConnectionState.Connected
        ) {
          console.log(
            "Joining thread for real-time updates:",
            existingThread.id
          );
          try {
            await connection.invoke("JoinThread", existingThread.id);
          } catch (error) {
            console.error("Failed to join thread:", error);
          }
        }
      } else {
        console.log("Creating new thread...");
        const threadData = { userId: currentUserId, consultantId: staff.id };
        const createdThread = await startChatThread(threadData, token);

        const threadId =
          createdThread?.data?.id ||
          createdThread?.data?.chatThreadId ||
          createdThread?.chatThreadId;

        if (!threadId) {
          console.error("No threadId found in response:", createdThread);
          Alert.alert(
            "Error",
            "Failed to start chat thread. Please try again."
          );
          return;
        }

        const threadWithMessages = await getChatThreadById(threadId, token);
        const thread = threadWithMessages?.data || {
          id: threadId,
          consultantId: staff.id,
          userId: currentUserId,
          messages: [],
        };

        setStaffChatThread(thread);
        setStaffMessages(thread.messages || []);

        if (
          connection &&
          connection.state === signalR.HubConnectionState.Connected
        ) {
          console.log("Joining new thread for real-time updates:", threadId);
          try {
            await connection.invoke("JoinThread", threadId);
          } catch (error) {
            console.error("Failed to join thread:", error);
          }
        }
      }
    } catch (error) {
      console.error("Failed to initialize staff thread:", error);
    }
  };

  const loadThreadMessages = (thread) => {
    const processedMessages = (thread.messages || []).map((msg) => {
      let timestamp = msg.createdAt || msg.sentAt || new Date().toISOString();
      if (typeof timestamp === "string" && !timestamp.includes("Z")) {
        timestamp = timestamp + "Z";
      }

      return {
        id: msg.id || Date.now().toString(),
        text: msg.messageText || msg.message || msg.text || "",
        sender: msg.senderId === currentUserId ? "user" : "staff",
        timestamp: timestamp,
        staffName: selectedStaff?.displayName || "Staff",
        isRead: true,
      };
    });

    setStaffMessages(processedMessages);
    if (activeMode === "staff") {
      setMessages(processedMessages);
    }
  };

  const sendAIMessage = async () => {
    if (!input.trim() || isLoading) return;

    let currentChatId = selectedChatId;
    let storedHistory = chatHistory;

    if (currentChatId === null && activeMode === "ai") {
      currentChatId = Date.now().toString();
      const newChat = { id: currentChatId, question: input.trim(), messages: [] };
      storedHistory = [...chatHistory, newChat];
      setChatHistory(storedHistory);
      await AsyncStorage.setItem("chatHistory", JSON.stringify(storedHistory));
      setSelectedChatId(currentChatId);
      setCurrentPage(Math.ceil(storedHistory.length / chatsPerPage));
    }

    const userMessage = {
      id: Date.now().toString(),
      text: input.trim(),
      sender: "user",
      timestamp: new Date().toISOString(),
    };

    setAiMessages((prev) => [...prev, userMessage]);
    setMessages((prev) => [...prev, userMessage]);

    if (activeMode === "ai") {
      const updatedHistory = storedHistory.map((chat) =>
        chat.id === currentChatId
          ? { ...chat, question: chat.question || input.trim(), messages: [...(chat.messages || []), userMessage] }
          : chat
      );
      setChatHistory(updatedHistory);
      await AsyncStorage.setItem("chatHistory", JSON.stringify(updatedHistory));
    }

    const currentInput = input;
    setInput("");
    setIsLoading(true);

    try {
      const response = await getAIChatResponse({ message: currentInput });

      const aiMessage = {
        id: (Date.now() + 1).toString(),
        text:
          response.data?.response || "Sorry, I could not process your request.",
        sender: "ai",
        timestamp: new Date().toISOString(),
      };

      setAiMessages((prev) => [...prev, aiMessage]);
      setMessages((prev) => [...prev, aiMessage]);

      if (activeMode === "ai") {
        const finalHistory = chatHistory.map((chat) =>
          chat.id === currentChatId
            ? { ...chat, messages: [...(chat.messages || []), userMessage, aiMessage] }
            : chat
        );
        setChatHistory(finalHistory);
        await AsyncStorage.setItem("chatHistory", JSON.stringify(finalHistory));
      }

      await saveMessagesToStorage("ai", [...aiMessages, userMessage, aiMessage]);
    } catch (error) {
      console.error("AI response error:", error);

      const errorMessage = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I encountered an error. Please try again.",
        sender: "ai",
        timestamp: new Date().toISOString(),
      };

      setAiMessages((prev) => [...prev, errorMessage]);
      setMessages((prev) => [...prev, errorMessage]);

      if (activeMode === "ai") {
        const finalHistory = chatHistory.map((chat) =>
          chat.id === currentChatId
            ? { ...chat, messages: [...(chat.messages || []), userMessage, errorMessage] }
            : chat
        );
        setChatHistory(finalHistory);
        await AsyncStorage.setItem("chatHistory", JSON.stringify(finalHistory));
      }
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const sendStaffMessage = async () => {
    if (
      !connection ||
      connection.state !== signalR.HubConnectionState.Connected
    ) {
      console.error("SignalR connection not established");
      Alert.alert(
        "Connection Error",
        "Connection lost. Please refresh the app."
      );
      return;
    }

    if (!input.trim() || !selectedStaff || !staffChatThread || sendingMessage) {
      return;
    }

    const userMessage = {
      id: Date.now().toString(),
      text: input.trim(),
      sender: "user",
      timestamp: new Date().toISOString(),
      staffName: selectedStaff.displayName,
    };

    setStaffMessages((prev) => [...prev, userMessage]);
    setMessages((prev) => [...prev, userMessage]);

    const currentInput = input;
    setInput("");
    setSendingMessage(true);

    try {
      const formData = new FormData();
      formData.append("ChatThreadId", staffChatThread.id);
      formData.append("SenderId", currentUserId);
      formData.append("MessageText", currentInput);

      const response = await fetch(
        "https://api.nestlycare.live/api/message/send-message",
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );

      const responseData = await response.json();
      console.log("=== Message Send Response ===", {
        status: response.status,
        response: responseData,
      });

      if (response.ok && responseData.error === 0) {
        console.log("Message sent successfully");
        await saveMessagesToStorage("staff", [...staffMessages, userMessage]);
      } else {
        console.error("API Error:", responseData);
        Alert.alert(
          "Error",
          `Failed to send message: ${responseData.message || "Unknown error"}`
        );
        setStaffMessages((prev) =>
          prev.filter((msg) => msg.id !== userMessage.id)
        );
        setMessages((prev) => prev.filter((msg) => msg.id !== userMessage.id));
        setInput(currentInput);
      }
    } catch (error) {
      console.error("Network Error:", error);
      Alert.alert("Error", `Failed to send message: ${error.message}`);
      setStaffMessages((prev) =>
        prev.filter((msg) => msg.id !== userMessage.id)
      );
      setMessages((prev) => prev.filter((msg) => msg.id !== userMessage.id));
      setInput(currentInput);
    } finally {
      setSendingMessage(false);
    }
  };

  useEffect(() => {
    if (contextMessages && contextMessages.length > 0) {
      const latestMessage = contextMessages[contextMessages.length - 1];
      handleRealTimeMessage(latestMessage);
    }
  }, [contextMessages]);

  const handleRealTimeMessage = (message) => {
    console.log("📨 [DEBUG] === REAL-TIME MESSAGE HANDLER ===", {
      id: message.id,
      senderId: message.senderId,
      currentUserId: currentUserId,
      messageText: message.messageText?.substring(0, 50),
      chatThreadId: message.chatThreadId,
      staffChatThreadId: staffChatThread?.id,
      selectedStaff: selectedStaff?.displayName,
      activeMode: activeMode,
    });

    if (!message.id || processedMessageIds.current.has(message.id)) {
      return;
    }

    processedMessageIds.current.add(message.id);

    const messageThreadId = message.chatThreadId || message.threadId;
    let isForCurrentThread = false;

    if (messageThreadId && staffChatThread) {
      isForCurrentThread = messageThreadId === staffChatThread.id;
    } else if (selectedStaff && message.senderId !== currentUserId) {
      isForCurrentThread = message.senderId === selectedStaff.id;
    }

    if (selectedStaff && isForCurrentThread) {
      const processedMessage = {
        id: message.id || Date.now().toString(),
        text: message.messageText || message.message || message.text || "",
        sender: message.senderId === currentUserId ? "user" : "staff",
        timestamp: formatUTCTimestamp(
          message.creationDate || message.createdAt || message.sentAt
        ),
        staffName: selectedStaff.displayName,
        isRead: true,
      };

      setStaffMessages((prev) => {
        const exists = prev.find((m) => m.id === processedMessage.id);
        if (exists) return prev;
        const updated = [...prev, processedMessage];
        saveMessagesToStorage("staff", updated);
        return updated;
      });

      if (activeMode === "staff") {
        setMessages((prev) => {
          const exists = prev.find((m) => m.id === processedMessage.id);
          if (exists) return prev;
          return [...prev, processedMessage];
        });

        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    }
  };

  const formatUTCTimestamp = (timestamp) => {
    if (!timestamp) return new Date().toISOString();
    if (typeof timestamp === "string" && !timestamp.includes("Z")) {
      return timestamp + "Z";
    }
    return timestamp;
  };

  const formatMessageTime = (timestamp) => {
    if (!timestamp) return "";

    try {
      let utcDate;
      if (typeof timestamp === "string") {
        utcDate = new Date(
          timestamp.endsWith("Z") ? timestamp : timestamp + "Z"
        );
      } else if (typeof timestamp === "number") {
        utcDate =
          timestamp > 1000000000000
            ? new Date(timestamp)
            : new Date(timestamp * 1000);
      } else if (timestamp instanceof Date) {
        utcDate = timestamp;
      } else {
        return "";
      }

      if (isNaN(utcDate.getTime())) {
        console.warn("Invalid timestamp:", timestamp);
        return "";
      }

      return utcDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.warn("Error formatting timestamp:", error);
      return "";
    }
  };

  const saveMessagesToStorage = async (type, messages) => {
    try {
      await AsyncStorage.setItem(
        `advice_${type}_messages`,
        JSON.stringify(messages)
      );
    } catch (error) {
      console.error("Failed to save messages:", error);
    }
  };

  const loadExistingMessages = async () => {
    try {
      const [aiData, staffData] = await Promise.all([
        AsyncStorage.getItem("advice_ai_messages"),
        AsyncStorage.getItem("advice_staff_messages"),
      ]);

      if (aiData) {
        const aiMessages = JSON.parse(aiData);
        setAiMessages(aiMessages);
        if (activeMode === "ai") setMessages(aiMessages);
      }

      if (staffData) {
        const staffMessages = JSON.parse(staffData);
        setStaffMessages(staffMessages);
        if (activeMode === "staff") setMessages(staffMessages);
      }
    } catch (error) {
      console.error("Failed to load messages:", error);
    }
  };

  const startNewChat = async () => {
    const newChat = { id: Date.now().toString(), question: "", messages: [] };
    setMessages([]);
    setInput("");
    setSelectedChatId(newChat.id);
    setAiMessages([]);
    if (activeMode === "ai") {
      setMessages([]);
    }
    setChatHistory((prev) => {
      const newHistory = [...prev, newChat];
      AsyncStorage.setItem("chatHistory", JSON.stringify(newHistory));
      setCurrentPage(Math.ceil(newHistory.length / chatsPerPage));
      return newHistory;
    });
    setShowHistoryModal(false);
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const loadChatHistoryMessages = (chatId) => {
    const chat = chatHistory.find((ch) => ch.id === chatId);
    if (chat && activeMode === "ai") {
      setMessages(chat.messages || []);
      setAiMessages(chat.messages || []);
      setSelectedChatId(chatId);
      setShowHistoryModal(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const deleteChat = async (chatId) => {
    const updatedHistory = chatHistory.filter((chat) => chat.id !== chatId);
    setChatHistory(updatedHistory);
    await AsyncStorage.setItem("chatHistory", JSON.stringify(updatedHistory));
    if (selectedChatId === chatId && activeMode === "ai") {
      setMessages([]);
      setAiMessages([]);
      setSelectedChatId(null);
    }
    const newTotalPages = Math.ceil(updatedHistory.length / chatsPerPage);
    if (currentPage > newTotalPages && newTotalPages > 0) {
      setCurrentPage(newTotalPages);
    } else if (updatedHistory.length === 0) {
      setCurrentPage(1);
    }
  };

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

  const switchToAI = () => {
    setActiveMode("ai");
    setMessages(aiMessages);
    setSelectedStaff(null);
    setStaffChatThread(null);
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const switchToStaff = () => {
    if (staffMembers.length === 0) {
      Alert.alert("No Staff Available", "Please try again later.");
      return;
    }

    if (!selectedStaff) {
      setShowStaffSelection(true);
    } else {
      setActiveMode("staff");
      setMessages(staffMessages);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const handleSend = () => {
    Keyboard.dismiss(); // Dismiss keyboard when sending
    if (activeMode === "ai") {
      sendAIMessage();
    } else {
      sendStaffMessage();
    }
  };

  const renderMessage = ({ item, index }) => {
    const isUser = item.sender === "user";
    const isAI = item.sender === "ai";

    return (
      <Animatable.View
        key={item.id}
        animation="fadeInUp"
        duration={300}
        delay={index * 50}
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.otherMessageContainer,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isUser
              ? styles.userMessage
              : isAI
              ? styles.aiMessage
              : styles.staffMessage,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isUser ? styles.userMessageText : styles.otherMessageText,
            ]}
          >
            {item.text}
          </Text>
          <Text style={styles.messageTime}>
            {formatMessageTime(item.timestamp)}
          </Text>
        </View>
      </Animatable.View>
    );
  };

  const StaffSelectionModal = () => (
    <Modal
      visible={showStaffSelection}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowStaffSelection(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Select Staff Member</Text>
          <TouchableOpacity
            onPress={() => setShowStaffSelection(false)}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>
        <FlatList
          data={staffMembers}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.staffItem}
              onPress={() => selectStaff(item)}
            >
              <View style={styles.staffInfo}>
                <Ionicons
                  name={item.type === "health" ? "heart" : "nutrition"}
                  size={24}
                  color={item.type === "health" ? "#FF9800" : "#007AFF"}
                />
                <View style={styles.staffDetails}>
                  <Text style={styles.staffName}>{item.displayName}</Text>
                  <Text style={styles.staffType}>
                    {item.type === "health"
                      ? "Health Expert"
                      : "Nutrition Specialist"}
                  </Text>
                  <Text style={styles.staffStatus}>Online</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
          )}
        />
      </SafeAreaView>
    </Modal>
  );

  const ChatHistoryModal = () => (
    <Modal
      visible={showHistoryModal}
      animationType="slide"
      onRequestClose={() => setShowHistoryModal(false)}
    >
      <SafeAreaView style={styles.historyModal}>
        <View style={styles.historyHeader}>
          <Text style={styles.historyTitle}>AI Chat History</Text>
          <TouchableOpacity
            onPress={() => setShowHistoryModal(false)}
            style={styles.closeHistoryButton}
          >
            <Ionicons name="close" size={28} color="#1a1a1a" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.newChatButton}
          onPress={startNewChat}
          accessible
          accessibilityLabel="Start new AI chat"
          accessibilityRole="button"
          accessibilityHint="Begin a new AI chat session"
        >
          <Text style={styles.newChatButtonText}>New AI Chat</Text>
        </TouchableOpacity>
        {chatHistory.length === 0 ? (
          <Text style={styles.emptyHistoryMessage}>No AI chat history yet.</Text>
        ) : (
          <FlatList
            data={currentChats}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <Animatable.View
                animation="fadeInUp"
                duration={300}
                style={[
                  styles.historyItem,
                  selectedChatId === item.id && styles.historyItemSelected,
                ]}
              >
                <Pressable
                  style={styles.historyContent}
                  onPress={() => loadChatHistoryMessages(item.id)}
                  accessible
                  accessibilityLabel={`AI Chat: ${item.question || "New Chat"}`}
                  accessibilityRole="button"
                  accessibilityHint="Load this AI chat session"
                >
                  <Text style={styles.historySender}>
                    {item.question || "New Chat"}:
                  </Text>
                  <Text style={styles.historyText}>
                    {item.messages.length > 0
                      ? item.messages[item.messages.length - 1].text.slice(0, 50) +
                        "..."
                      : "No messages yet"}
                  </Text>
                  <Text style={styles.historyTimestamp}>
                    {item.messages.length > 0
                      ? formatMessageTime(item.messages[item.messages.length - 1].timestamp)
                      : new Date(parseInt(item.id)).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                  </Text>
                </Pressable>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deleteChat(item.id)}
                  accessible
                  accessibilityLabel="Delete AI chat"
                  accessibilityRole="button"
                  accessibilityHint="Remove this AI chat from history"
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
              style={[
                styles.paginationButton,
                currentPage === 1 && styles.paginationButtonDisabled,
              ]}
              onPress={goToPreviousPage}
              disabled={currentPage === 1}
              accessible
              accessibilityLabel="Previous page"
              accessibilityRole="button"
              accessibilityHint="Go to previous AI chat history page"
            >
              <Ionicons name="chevron-back" size={16} color="#ffffff" />
              <Text style={styles.paginationButtonText}>Prev</Text>
            </TouchableOpacity>
            <Text style={styles.paginationInfo}>
              {currentPage}/{totalPages}
            </Text>
            <TouchableOpacity
              style={[
                styles.paginationButton,
                currentPage === totalPages && styles.paginationButtonDisabled,
              ]}
              onPress={goToNextPage}
              disabled={currentPage === totalPages}
              accessible
              accessibilityLabel="Next page"
              accessibilityRole="button"
              accessibilityHint="Go to next AI chat history page"
            >
              <Text style={styles.paginationButtonText}>Next</Text>
              <Ionicons name="chevron-forward" size={16} color="#ffffff" />
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );

  if (!isInitialized) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Initializing...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Health Advice</Text>
          <View style={styles.headerRight}>
            {activeMode === "ai" && (
              <TouchableOpacity
                onPress={() => setShowHistoryModal(true)}
                style={styles.historyButton}
                accessible
                accessibilityLabel="View AI chat history"
                accessibilityRole="button"
                accessibilityHint="Open AI chat history view"
              >
                <Ionicons name="time-outline" size={24} color="#333" />
              </TouchableOpacity>
            )}
            {activeMode === "staff" && (
              <TouchableOpacity
                onPress={() => setShowStaffSelection(true)}
                style={styles.staffSwitchButton}
              >
                <Ionicons name="people" size={20} color="#007AFF" />
                <Text style={styles.staffSwitchText}>Switch</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        <View style={styles.modeSelector}>
          <TouchableOpacity
            style={[
              styles.modeButton,
              activeMode === "ai" && styles.activeModeButton,
            ]}
            onPress={switchToAI}
          >
            <Ionicons
              name="chatbubbles"
              size={20}
              color={activeMode === "ai" ? "#fff" : "#666"}
            />
            <Text
              style={[
                styles.modeButtonText,
                activeMode === "ai" && styles.activeModeButtonText,
              ]}
            >
              AI Assistant
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.modeButton,
              activeMode === "staff" && styles.activeModeButton,
            ]}
            onPress={switchToStaff}
          >
            <Ionicons
              name="people"
              size={20}
              color={activeMode === "staff" ? "#fff" : "#666"}
            />
            <Text
              style={[
                styles.modeButtonText,
                activeMode === "staff" && styles.activeModeButtonText,
              ]}
            >
              {selectedStaff ? selectedStaff.displayName : "Staff Consultation"}
            </Text>
          </TouchableOpacity>
        </View>
        {activeMode === "staff" && (
          <View style={styles.statusBanner}>
            <Text style={styles.statusBannerText}>
              {connection &&
              connection.state === signalR.HubConnectionState.Connected
                ? "Connected to staff chat"
                : connectionError
                ? "Connection error"
                : "Connecting to staff chat..."}
            </Text>
          </View>
        )}
        <FlatList
          ref={scrollViewRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => {
            setTimeout(
              () => scrollViewRef.current?.scrollToEnd({ animated: true }),
              100
            );
          }}
        />
        {(isLoading || sendingMessage) && (
          <View style={styles.loadingIndicator}>
            <ActivityIndicator color="#007AFF" />
            <Text style={styles.loadingText}>
              {activeMode === "ai" ? "AI is thinking..." : "Sending message..."}
            </Text>
          </View>
        )}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder={
              activeMode === "ai"
                ? "Ask AI for health advice..."
                : selectedStaff
                ? `Message ${selectedStaff.displayName}...`
                : "Select staff to chat..."
            }
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={1000}
            editable={
              activeMode === "ai" ||
              (activeMode === "staff" &&
                selectedStaff &&
                connection?.state === signalR.HubConnectionState.Connected)
            }
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!input.trim() ||
                isLoading ||
                sendingMessage ||
                (activeMode === "staff" &&
                  (!selectedStaff ||
                    connection?.state !==
                      signalR.HubConnectionState.Connected))) &&
                styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={
              !input.trim() ||
              isLoading ||
              sendingMessage ||
              (activeMode === "staff" &&
                (!selectedStaff ||
                  connection?.state !== signalR.HubConnectionState.Connected))
            }
          >
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        <StaffSelectionModal />
        <ChatHistoryModal />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  staffSwitchButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 12,
    borderRadius: 12,
    backgroundColor: "#E3F2FD",
  },
  staffSwitchText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: "500",
    color: "#007AFF",
  },
  historyButton: {
    padding: 8,
  },
  modeSelector: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  modeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    elevation: 1,
  },
  activeModeButton: {
    backgroundColor: "#007AFF",
    elevation: 3,
  },
  modeButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  activeModeButtonText: {
    color: "#fff",
  },
  statusBanner: {
    backgroundColor: "#E3F2FD",
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  statusBannerText: {
    color: "#1565C0",
    fontSize: 12,
    textAlign: "center",
    fontWeight: "500",
  },
  messagesList: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  messagesContent: {
    paddingVertical: 16,
  },
  messageContainer: {
    paddingHorizontal: 16,
    marginVertical: 4,
  },
  userMessageContainer: {
    alignItems: "flex-end",
  },
  otherMessageContainer: {
    alignItems: "flex-start",
  },
  messageBubble: {
    maxWidth: "80%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  userMessage: {
    backgroundColor: "#007AFF",
  },
  aiMessage: {
    backgroundColor: "#2196F3",
  },
  staffMessage: {
    backgroundColor: "#2196F3",
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  userMessageText: {
    color: "#fff",
  },
  otherMessageText: {
    color: "#fff",
  },
  messageTime: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 4,
  },
  loadingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  loadingText: {
    marginLeft: 8,
    color: "#666",
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    fontSize: 16,
    maxHeight: 100,
    backgroundColor: "#f8f9fa",
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#007AFF",
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  sendButtonDisabled: {
    backgroundColor: "#ccc",
    elevation: 1,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    elevation: 2,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  closeButton: {
    padding: 4,
  },
  staffItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  staffInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  staffDetails: {
    marginLeft: 12,
    flex: 1,
  },
  staffName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  staffType: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  staffStatus: {
    fontSize: 12,
    color: "#007AFF",
    marginTop: 2,
    fontWeight: "500",
  },
  historyModal: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: height * 0.7,
    position: "absolute",
    bottom: 0,
    width: "100%",
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  historyTitle: {
    fontSize: width < 360 ? 20 : width < 480 ? 22 : 24,
    fontWeight: "700",
    color: "#1a1a1a",
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  closeHistoryButton: {
    padding: 12,
    minWidth: 44,
    minHeight: 44,
  },
  newChatButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 14,
    marginBottom: 12,
    minHeight: 48,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
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
    color: "#ffffff",
    fontSize: width < 360 ? 16 : width < 480 ? 18 : 20,
    fontWeight: "600",
    textAlign: "center",
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  emptyHistoryMessage: {
    textAlign: "center",
    color: "#888888",
    fontSize: width < 360 ? 14 : width < 480 ? 16 : 18,
    padding: 20,
    opacity: 0.7,
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  historyItem: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
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
    backgroundColor: "#e0e0e0",
  },
  historyContent: {
    flex: 1,
    paddingRight: 40,
  },
  historySender: {
    fontSize: width < 360 ? 16 : width < 480 ? 18 : 20,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 8,
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  historyText: {
    fontSize: width < 360 ? 14 : width < 480 ? 16 : 18,
    color: "#333333",
    marginBottom: 8,
    lineHeight: 24,
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  historyTimestamp: {
    fontSize: width < 360 ? 12 : width < 480 ? 14 : 16,
    color: "#999999",
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  deleteButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#ff3b30",
    borderRadius: 16,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    gap: 8,
  },
  paginationButton: {
    backgroundColor: "#ff3b30",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 48,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
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
    backgroundColor: "#d1d5db",
    opacity: 0.6,
    shadowOpacity: 0,
  },
  paginationButtonText: {
    color: "#ffffff",
    fontSize: width < 360 ? 14 : width < 480 ? 16 : 18,
    fontWeight: "600",
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  paginationInfo: {
    fontSize: width < 360 ? 14 : width < 480 ? 16 : 18,
    fontWeight: "600",
    color: "#1a1a1a",
    backgroundColor: "#ffffff",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
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