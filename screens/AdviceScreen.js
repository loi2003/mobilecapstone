import React, { useState, useEffect, useRef } from "react";
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
  Keyboard,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as Animatable from "react-native-animatable";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";

// ✅ SignalR import (same as ConsultationChat.js)
import * as signalR from "@microsoft/signalr";

// API imports
import { getAIChatResponse } from "../api/aiadvise-api";
import {
  startChatThread,
  getChatThreadByUserId,
  getChatThreadById,
} from "../api/message-api";
import { getAllUsers } from "../api/user-api";
import { getCurrentUser } from "../api/auth";

// ✅ Message Context (same as ConsultationChat.js)
import { useMessages } from "../contexts/MessageContext";

// Polyfill for SignalR compatibility (same as ConsultationChat.js)
if (!globalThis.document) {
  globalThis.document = undefined;
}

const { width, height } = Dimensions.get("window");

const AdviceScreen = () => {
  // ✅ Use MessageContext (same as ConsultationChat.js)
  const {
    connection,
    messages: contextMessages,
    addMessage,
    connectionError,
  } = useMessages();

  // ========== EXISTING STATES (Enhanced) ==========
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [activeMode, setActiveMode] = useState("ai"); // 'ai' or 'staff'
  const [isLoading, setIsLoading] = useState(false);

  // ========== NEW STATES (From Web Version + ConsultationChat.js patterns) ==========
  // User and Authentication
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserId, setCurrentUserId] = useState("");
  const [token, setToken] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Staff Management (replaces mock system)
  const [staffMembers, setStaffMembers] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showStaffSelection, setShowStaffSelection] = useState(false);

  // Thread-based Chat System
  const [staffChatThread, setStaffChatThread] = useState(null);
  const [staffMessages, setStaffMessages] = useState([]);
  const [aiMessages, setAiMessages] = useState([]);
  const [sendingMessage, setSendingMessage] = useState(false);

  // Real-time Message Handling
  const processedMessageIds = useRef(new Set());
  const scrollViewRef = useRef(null);

  const navigation = useNavigation();

  // ========== INITIALIZATION (Enhanced with ConsultationChat.js patterns) ==========
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Same token retrieval pattern as ConsultationChat.js
      const storedToken = await AsyncStorage.getItem("authToken");
      if (!storedToken) {
        Alert.alert("Error", "Please login first");
        navigation.navigate("SignIn", {
          redirectTo: "Advice",
          params: {},
        });
        return;
      }

      setToken(storedToken);

      // Same user retrieval pattern as ConsultationChat.js
      const userRes = await getCurrentUser(storedToken);
      const userId =
        userRes?.data?.data?.id || userRes?.data?.id || userRes?.id || "";

      if (!userId) {
        await AsyncStorage.removeItem("authToken");
        navigation.navigate("SignIn", {
          redirectTo: "Advice",
          params: {},
        });
        return;
      }

      await AsyncStorage.setItem("userId", userId);
      setCurrentUserId(userId);
      setCurrentUser({ id: userId, ...userRes?.data?.data });

      // Load existing messages
      await loadExistingMessages();

      // Load staff members
      await loadStaffMembers(storedToken);

      setIsInitialized(true);
    } catch (error) {
      console.error("Initialization error:", error);
      Alert.alert("Error", "Failed to initialize app");
    }
  };

  // ========== STAFF MANAGEMENT (Enhanced) ==========
  const loadStaffMembers = async (authToken) => {
    try {
      const response = await getAllUsers(authToken);
      const users = response.data?.data || response.data || [];

      // Filter staff members (roleId 4 = nutrition, roleId 3 = health expert)
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

      // Initialize or load chat thread with selected staff
      await initializeStaffThread(staff);
    } catch (error) {
      console.error("Failed to select staff:", error);
      Alert.alert("Error", "Failed to connect with staff member");
    }
  };

  // ========== THREAD MANAGEMENT (Enhanced with ConsultationChat.js patterns) ==========
  const initializeStaffThread = async (staff) => {
    try {
      if (!currentUserId || !token) return;

      console.log("Initializing staff thread for:", staff.displayName);

      // Same thread loading pattern as ConsultationChat.js
      const threadsResponse = await getChatThreadByUserId(currentUserId, token);
      let threads = [];

      if (Array.isArray(threadsResponse)) {
        threads = threadsResponse;
      } else if (threadsResponse?.data && Array.isArray(threadsResponse.data)) {
        threads = threadsResponse.data;
      } else if (threadsResponse?.id && threadsResponse?.consultantId) {
        threads = [threadsResponse];
      }

      // Find existing thread with this staff member
      const existingThread = threads.find(
        (thread) =>
          thread.consultantId === staff.id ||
          (thread.userId === currentUserId && thread.consultantId === staff.id)
      );

      if (existingThread) {
        // Load existing thread
        console.log("Loading existing thread:", existingThread.id);
        setStaffChatThread(existingThread);
        await loadThreadMessages(existingThread);

        // Join the thread for real-time updates
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
        // Create new thread
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

        // Load the created thread with messages
        const threadWithMessages = await getChatThreadById(threadId, token);
        const thread = threadWithMessages?.data || {
          id: threadId,
          consultantId: staff.id,
          userId: currentUserId,
          messages: [],
        };

        setStaffChatThread(thread);
        setStaffMessages(thread.messages || []);

        // Join the new thread for real-time updates
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
      // Same UTC timestamp handling as ConsultationChat.js
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

    // Update main messages if staff mode is active
    if (activeMode === "staff") {
      setMessages(processedMessages);
    }
  };

  // ========== MESSAGING FUNCTIONS (Enhanced with ConsultationChat.js patterns) ==========
  const sendAIMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      text: input.trim(),
      sender: "user",
      timestamp: new Date().toISOString(),
    };

    setAiMessages((prev) => [...prev, userMessage]);
    setMessages((prev) => [...prev, userMessage]);

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

      // Save to AsyncStorage
      await saveMessagesToStorage("ai", [
        ...aiMessages,
        userMessage,
        aiMessage,
      ]);
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

    // Add to UI immediately
    setStaffMessages((prev) => [...prev, userMessage]);
    setMessages((prev) => [...prev, userMessage]);

    const currentInput = input;
    setInput("");
    setSendingMessage(true);

    try {
      // Same direct fetch pattern as ConsultationChat.js
      const formData = new FormData();
      formData.append("ChatThreadId", staffChatThread.id);
      formData.append("SenderId", currentUserId);
      formData.append("MessageText", currentInput);

      const response = await fetch(
        "https://api.nestlycare.live/api/message/send-message",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const responseData = await response.json();
      console.log("=== Message Send Response ===");
      console.log("Status:", response.status);
      console.log("Response:", responseData);

      if (response.ok && responseData.error === 0) {
        // Success - message will come via SignalR
        console.log("Message sent successfully");

        // Save to AsyncStorage
        await saveMessagesToStorage("staff", [...staffMessages, userMessage]);
      } else {
        console.error("API Error:", responseData);
        Alert.alert(
          "Error",
          `Failed to send message: ${responseData.message || "Unknown error"}`
        );

        // Remove the message from UI since it failed
        setStaffMessages((prev) =>
          prev.filter((msg) => msg.id !== userMessage.id)
        );
        setMessages((prev) => prev.filter((msg) => msg.id !== userMessage.id));

        // Restore input
        setInput(currentInput);
      }
    } catch (error) {
      console.error("Network Error:", error);
      Alert.alert("Error", `Failed to send message: ${error.message}`);

      // Remove the message from UI since it failed
      setStaffMessages((prev) =>
        prev.filter((msg) => msg.id !== userMessage.id)
      );
      setMessages((prev) => prev.filter((msg) => msg.id !== userMessage.id));

      // Restore input
      setInput(currentInput);
    } finally {
      setSendingMessage(false);
    }
  };

  // ========== REAL-TIME MESSAGE HANDLING (From ConsultationChat.js patterns) ==========
  useEffect(() => {
    if (contextMessages && contextMessages.length > 0) {
      const latestMessage = contextMessages[contextMessages.length - 1];
      handleRealTimeMessage(latestMessage);
    }
  }, [contextMessages]);

  const handleRealTimeMessage = (message) => {
    console.log("📨 [DEBUG] === REAL-TIME MESSAGE HANDLER ===");
    console.log("📨 [DEBUG] Received message:", {
      id: message.id,
      senderId: message.senderId,
      currentUserId: currentUserId,
      messageText: message.messageText?.substring(0, 50),
      chatThreadId: message.chatThreadId,
      staffChatThreadId: staffChatThread?.id,
      selectedStaff: selectedStaff?.displayName,
      activeMode: activeMode,
    });

    // Prevent duplicate processing
    if (!message.id || processedMessageIds.current.has(message.id)) {
      return;
    }

    processedMessageIds.current.add(message.id);

    const messageThreadId = message.chatThreadId || message.threadId;

    let isForCurrentThread = false;

    if (messageThreadId && staffChatThread) {
      // Standard thread matching
      isForCurrentThread = messageThreadId === staffChatThread.id;
    } else if (selectedStaff && message.senderId !== currentUserId) {
      isForCurrentThread = message.senderId === selectedStaff.id;
    }

    // Process message if it's for staff consultation
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

      // Always update staff messages
      setStaffMessages((prev) => {
        // Check if message already exists
        const exists = prev.find((m) => m.id === processedMessage.id);
        if (exists) {
          return prev;
        }

        const updated = [...prev, processedMessage];

        // Save to storage
        saveMessagesToStorage("staff", updated);

        return updated;
      });

      // Update current view messages if in staff mode
      if (activeMode === "staff") {
        setMessages((prev) => {
          // Check if message already exists
          const exists = prev.find((m) => m.id === processedMessage.id);
          if (exists) {
            return prev;
          }

          const updated = [...prev, processedMessage];
          return updated;
        });

        // Auto-scroll to bottom
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } else {
        console.log(
          "🔍 [DEBUG] Not in staff mode (activeMode:",
          activeMode,
          ") - not updating main messages"
        );
      }
    } else {
    }
  };
  // ========== UTILITY FUNCTIONS (Enhanced with ConsultationChat.js patterns) ==========
  const formatUTCTimestamp = (timestamp) => {
    if (!timestamp) return new Date().toISOString();
    if (typeof timestamp === "string" && !timestamp.includes("Z")) {
      return timestamp + "Z";
    }
    return timestamp;
  };

  // Same time formatting as ConsultationChat.js
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

  // ========== MODE SWITCHING ==========
  const switchToAI = () => {
    setActiveMode("ai");
    setMessages(aiMessages);
    setTimeout(
      () => scrollViewRef.current?.scrollToEnd({ animated: true }),
      100
    );
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
      setTimeout(
        () => scrollViewRef.current?.scrollToEnd({ animated: true }),
        100
      );
    }
  };

  // ========== SEND MESSAGE HANDLER ==========
  const handleSend = () => {
    if (activeMode === "ai") {
      sendAIMessage();
    } else {
      sendStaffMessage();
    }
  };

  // ========== UI COMPONENTS ==========
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
            {/* {!isUser && activeMode === "staff" && (
              <Text style={styles.staffName}>
                {" "}
                - {item.staffName || selectedStaff?.displayName}
              </Text>
            )} */}
          </Text>
        </View>
      </Animatable.View>
    );
  };

  // Staff Selection Modal (same as before)
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
                  color={item.type === "health" ? "#FF9800" : "#4CAF50"}
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

  // Loading state
  if (!isInitialized) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Initializing...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ========== MAIN RENDER ==========
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Enhanced Header with Staff Switch Button */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Health Advice</Text>

          <View style={styles.headerRight}>
            {/* Staff Switch Button - only show when in staff mode */}
            {activeMode === "staff" && (
              <TouchableOpacity
                onPress={() => setShowStaffSelection(true)}
                style={styles.staffSwitchButton}
              >
                <Ionicons name="people" size={20} color="#4CAF50" />
                <Text style={styles.staffSwitchText}>Switch</Text>
              </TouchableOpacity>
            )}

            {/* Connection Status */}
            {/* <View style={styles.connectionStatus}>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor:
                      connection &&
                      connection.state === signalR.HubConnectionState.Connected
                        ? "#4CAF50"
                        : "#FF9800",
                  },
                ]}
              />
            </View> */}
          </View>
        </View>

        {/* Mode Selector */}
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

        {/* Connection Status Banner */}
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

        {/* Messages */}
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

        {/* Loading Indicator */}
        {(isLoading || sendingMessage) && (
          <View style={styles.loadingIndicator}>
            <ActivityIndicator color="#4CAF50" />
            <Text style={styles.loadingText}>
              {activeMode === "ai" ? "AI is thinking..." : "Sending message..."}
            </Text>
          </View>
        )}

        {/* Input Area */}
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

        {/* Staff Selection Modal */}
        <StaffSelectionModal />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ========== STYLES (Same as before) ==========
const styles = StyleSheet.create({
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
    backgroundColor: "#E8F5E8",
  },
  staffSwitchText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: "500",
    color: "#4CAF50",
  },
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
  connectionStatus: {
    alignItems: "center",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
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
    backgroundColor: "#4CAF50",
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
    backgroundColor: "#E8F5E8",
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  statusBannerText: {
    color: "#2E7D32",
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
    backgroundColor: "#4CAF50",
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
  staffName: {
    fontWeight: "500",
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
    backgroundColor: "#4CAF50",
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
  // Modal Styles (same as before)
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
    color: "#4CAF50",
    marginTop: 2,
    fontWeight: "500",
  },
});

export default AdviceScreen;
