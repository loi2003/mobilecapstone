import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ScrollView,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  StyleSheet,
  Dimensions,
  Modal,
  SafeAreaView,
  Animated,
  TouchableWithoutFeedback,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import Icon from "react-native-vector-icons/FontAwesome";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as signalR from "@microsoft/signalr";
import * as ImagePicker from "expo-image-picker";
import {
  startChatThread,
  sendMessage,
  getChatThreadByUserId,
  getChatThreadById,
} from "../api/message-api";
import { viewConsultantByUserId } from "../api/consultant-api";
import { getCurrentUser } from "../api/auth";
import { getAllClinics } from "../api/clinic-api";
import { useMessages } from "../contexts/MessageContext";

if (!globalThis.document) {
  globalThis.document = undefined;
}

const { width, height } = Dimensions.get("window");

const ConsultationChat = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const messagesEndRef = useRef(null);
  const { connection, messages, addMessage, connectionError } = useMessages();
  const {
    selectedConsultant: preSelectedConsultant,
    createdThread,
    currentUserId: passedUserId,
    clinicConsultants = [],
    clinicInfo = null,
  } = route.params || {};
  const [currentUserId, setCurrentUserId] = useState(passedUserId || "");
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [consultants, setConsultants] = useState([]);
  const [chatThreads, setChatThreads] = useState({});
  const [selectedConsultant, setSelectedConsultant] = useState(
    preSelectedConsultant || null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [startingChat, setStartingChat] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const sidebarAnim = useRef(new Animated.Value(-width * 0.8)).current;

  // Animation for sidebar
  useEffect(() => {
    Animated.timing(sidebarAnim, {
      toValue: isSidebarOpen ? 0 : -width * 0.8,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isSidebarOpen]);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollToEnd({ animated: true });
    });
  };

  const formatBytes = (bytes) => {
    if (!bytes && bytes !== 0) return "";
    const units = ["B", "KB", "MB", "GB"];
    let i = 0,
      n = bytes;
    while (n >= 1024 && i < units.length - 1) {
      n /= 1024;
      i++;
    }
    return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
  };

  const getFileIcon = (fileName, fileType) => {
    const name = (fileName || "").toLowerCase();
    const type = (fileType || "").toLowerCase();
    if (type.includes("pdf") || name.endsWith(".pdf")) return "file-pdf-o";
    if (
      type.includes("word") ||
      name.endsWith(".doc") ||
      name.endsWith(".docx")
    )
      return "file-word-o";
    if (
      type.includes("excel") ||
      name.endsWith(".xls") ||
      name.endsWith(".xlsx")
    )
      return "file-excel-o";
    if (
      type.startsWith("text/") ||
      name.endsWith(".txt") ||
      name.endsWith(".log")
    )
      return "file-text-o";
    return "file";
  };

  const supportedImageTypes = [".jpg", ".jpeg", ".png"];
  const allSupportedTypes = [...supportedImageTypes];

  useEffect(() => {
    initializePage();
  }, []);

  const initializePage = async () => {
    try {
      let userId = passedUserId;
      if (!userId) {
        const token = await AsyncStorage.getItem("authToken");
        if (!token) {
          navigation.navigate("SignIn", {
            redirectTo: "Consultation",
            params: route.params,
          });
          return;
        }
        const userRes = await getCurrentUser(token);
        userId =
          userRes?.data?.data?.id || userRes?.data?.id || userRes?.id || "";
        if (!userId) {
          await AsyncStorage.removeItem("authToken");
          navigation.navigate("SignIn", {
            redirectTo: "Consultation",
            params: route.params,
          });
          return;
        }
        await AsyncStorage.setItem("userId", userId);
      }
      setCurrentUserId(userId);
      await loadAllConsultants();
      await loadExistingThreads(userId);
    } catch (error) {
      console.error("Failed to initialize consultation chat:", error);
      navigation.navigate("SignIn", {
        redirectTo: "Consultation",
        params: route.params,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (preSelectedConsultant && !loading) {
      const consultantId = preSelectedConsultant.user?.id;
      if (consultantId && !chatThreads[consultantId]) {
        // This part is missing proper thread initialization
        setChatThreads((prevThreads) => ({
          ...prevThreads,
          [consultantId]: {
            thread: createdThread?.data || createdThread || null, // Should load existing thread here
            messages: [],
            consultant: preSelectedConsultant,
          },
        }));
        setSelectedConsultant(preSelectedConsultant);

        // Load existing thread if it exists
        loadExistingThreads(currentUserId);
      }
    }
  }, [preSelectedConsultant, loading, chatThreads]);

  const loadExistingThreads = async (userId) => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) return;
      const threadsResponse = await getChatThreadByUserId(userId, token);
      let threads = [];
      if (Array.isArray(threadsResponse)) {
        threads = threadsResponse;
      } else if (threadsResponse?.data && Array.isArray(threadsResponse.data)) {
        threads = threadsResponse.data;
      } else if (threadsResponse?.id && threadsResponse?.consultantId) {
        threads = [threadsResponse];
      }
      if (threads.length > 0) {
        const threadsMap = {};
        for (const thread of threads) {
          const consultantId = thread.consultantId;
          if (!consultantId) continue;
          try {
            const consultantRes = await viewConsultantByUserId(
              consultantId,
              token
            );
            const consultantData = consultantRes?.data || null;
            const processedMessages =
              thread.messages?.map((msg) => {
                if (msg.attachmentUrl || msg.attachmentPath || msg.attachment) {
                  return {
                    ...msg,
                    attachment: {
                      fileName:
                        msg.attachmentFileName || msg.fileName || "Attachment",
                      fileSize: msg.attachmentFileSize || msg.fileSize,
                      fileType: msg.attachmentFileType || msg.fileType,
                      isImage: isImageFile(
                        msg.attachmentFileName || msg.fileName
                      ),
                      url:
                        msg.attachmentUrl ||
                        msg.attachmentPath ||
                        msg.attachment?.url,
                    },
                  };
                }
                if (
                  msg.media &&
                  Array.isArray(msg.media) &&
                  msg.media.length > 0
                ) {
                  const firstMedia = msg.media[0];
                  return {
                    ...msg,
                    attachment: {
                      fileName: firstMedia.fileName || "Attachment",
                      fileSize: firstMedia.fileSize,
                      fileType: firstMedia.fileType,
                      isImage: isImageFile(firstMedia.fileName || ""),
                      url: firstMedia.fileUrl || firstMedia.url,
                    },
                  };
                }
                return msg;
              }) || [];
            threadsMap[consultantId] = {
              thread,
              messages: processedMessages,
              consultant: consultantData,
            };
          } catch (err) {
            console.error(`Failed to fetch consultant ${consultantId}:`, err);
          }
        }
        setChatThreads((prevThreads) => ({
          ...prevThreads,
          ...threadsMap,
        }));
      }
    } catch (error) {
      console.error("Failed to load existing threads:", error);
      alert("Failed to load chat threads. Please try again.");
    }
  };

  const loadAllConsultants = async () => {
    try {
      const clinicsData = await getAllClinics();
      const allClinics = clinicsData.data || clinicsData;
      const allConsultants = [];
      allClinics.forEach((clinic) => {
        if (clinic.consultants && clinic.consultants.length > 0) {
          clinic.consultants.forEach((consultant) => {
            allConsultants.push({
              ...consultant,
              clinic: {
                id: clinic.id,
                name: clinic.user?.userName || clinic.name,
                address: clinic.address,
              },
            });
          });
        }
      });
      setConsultants(allConsultants);
    } catch (error) {
      console.error("Failed to load consultants:", error);
      alert("Failed to load consultants. Please try again.");
    }
  };

  const handleSelectConsultant = async (consultant) => {
    const consultantId = consultant.user.id;
    setSelectedConsultant(consultant);
    setIsSidebarOpen(false);
    if (chatThreads[consultantId]) {
      return;
    }
    const enhancedConsultant = {
      ...consultant,
      clinic:
        consultant.clinic?.address && consultant.clinic?.name
          ? consultant.clinic
          : {
              id: clinicInfo?.id,
              name: clinicInfo?.name,
              address: clinicInfo?.address,
            },
    };
    setChatThreads((prevThreads) => ({
      ...prevThreads,
      [consultantId]: {
        thread: null,
        messages: [],
        consultant: enhancedConsultant,
      },
    }));
    setNewMessage("");
  };

  const handleStartChat = async () => {
    if (!selectedConsultant) return;
    const consultantId = selectedConsultant.user.id;
    if (chatThreads[consultantId]?.thread) {
      return;
    }
    try {
      setStartingChat(true);
      const token = await AsyncStorage.getItem("authToken");
      const threadData = { userId: currentUserId, consultantId };
      const createdThread = await startChatThread(threadData, token);
      const threadId =
        createdThread?.data?.id ||
        createdThread?.data?.chatThreadId ||
        createdThread?.chatThreadId;
      if (!threadId) {
        console.error("No threadId found in response:", createdThread);
        alert("Failed to start chat thread. Please try again.");
        return;
      }
      const threadWithMessages = await getChatThreadById(threadId, token);
      setChatThreads((prevThreads) => ({
        ...prevThreads,
        [consultantId]: {
          thread: threadWithMessages?.data || {
            id: threadId,
            consultantId,
            userId: currentUserId,
          },
          messages: threadWithMessages?.data?.messages || [],
          consultant: selectedConsultant,
        },
      }));
    } catch (error) {
      console.error("Failed to start chat thread:", error);
      alert(
        "Failed to start chat: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setStartingChat(false);
    }
  };

  const handleFileSelect = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        alert("Sorry, we need media library permissions to make this work!");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selected = result.assets[0];
        const isImage = supportedImageTypes.includes(
          "." + selected.uri.split(".").pop().toLowerCase()
        );
        if (!isImage) {
          alert("Only image files (.jpg, .jpeg, .png) are supported.");
          return;
        }
        setSelectedFile({
          uri: selected.uri,
          name: selected.fileName || `image_${Date.now()}.jpg`,
          type: selected.mimeType || "image/jpeg",
          size: selected.fileSize || 0,
        });
        setFilePreview(selected.uri);
      } else {
        console.log("Image picker cancelled");
      }
    } catch (err) {
      console.error("Image picker error:", err);
      alert("Failed to pick image: " + err.message);
    }
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
  };

  const isImageFile = (fileName) => {
    if (!fileName) return false;
    const extension = "." + fileName.toLowerCase().split(".").pop();
    return supportedImageTypes.includes(extension);
  };

  const handleSendMessage = async () => {
    if (
      !connection ||
      connection.state !== signalR.HubConnectionState.Connected
    ) {
      console.error("SignalR connection not established");
      alert("Connection lost. Please refresh the page.");
      return;
    }
    const consultantId = selectedConsultant?.user?.id;

    const activeThread =
      consultantId && chatThreads[consultantId]
        ? chatThreads[consultantId].thread
        : null;
    if (
      (!newMessage.trim() && !selectedFile) ||
      !activeThread ||
      sendingMessage
    )
      return;
    try {
    setSendingMessage(true);
    const token = await AsyncStorage.getItem('authToken');

    // ✅ Create FormData exactly like the working curl command
    const formData = new FormData();
    formData.append('ChatThreadId', activeThread.id);
    formData.append('SenderId', currentUserId);
    formData.append('MessageText', newMessage.trim());

    if (selectedFile) {
      formData.append('Attachments', {
        uri: selectedFile.uri,
        name: selectedFile.name,
        type: selectedFile.type,
      });
    }

    // console.log("=== Fetch Request Debug ===");
    // console.log("URL: https://api.nestlycare.live/api/message/send-message");
    // console.log("FormData _parts:", formData._parts);

    const response = await fetch('https://api.nestlycare.live/api/message/send-message', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    // const response = await sendMessage(formData, token);

    const responseData = await response.json();
    
    console.log("=== Fetch Response Debug ===");
    console.log("Status:", response.status);
    console.log("Response:", responseData);

    if (response.ok && responseData.error === 0) {
      // Success handling
      const messageData = responseData.data;
      const newMessageObj = {
        id: messageData.id,
        messageText: messageData.messageText,
        senderId: currentUserId,
        sentAt: new Date().toISOString(),
        isRead: false,
        media: messageData.media || [],
      };

      setChatThreads(prevThreads => ({
        ...prevThreads,
        [consultantId]: {
          ...prevThreads[consultantId],
          messages: [...(prevThreads[consultantId]?.messages || []), newMessageObj],
        },
      }));

      setNewMessage('');
      setSelectedFile(null);
    } else {
      console.error("API Error:", responseData);
      alert(`Failed to send message: ${responseData.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.error("Network Error:", error);
    alert(`Failed to send message: ${error.message}`);
  } finally {
    setSendingMessage(false);
  }
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

  const renderMessage = (msg, idx) => {
    const isSent = msg.senderId === currentUserId;
    const hasAttachment = msg.attachment;
    return (
      <View
        key={idx}
        style={[
          styles.message,
          isSent ? styles.sentMessage : styles.receivedMessage,
        ]}
      >
        <View
          style={[
            styles.messageContent,
            isSent ? styles.sentMessageContent : styles.receivedMessageContent,
          ]}
        >
          {(msg.messageText || msg.message) && (
            <Text
              style={[
                styles.messageText,
                isSent ? styles.sentMessageText : styles.receivedMessageText,
              ]}
            >
              {msg.messageText || msg.message}
            </Text>
          )}
          {hasAttachment &&
            (hasAttachment.isImage ? (
              <TouchableOpacity onPress={() => {}}>
                <Image
                  source={{ uri: hasAttachment.url }}
                  style={styles.attachmentImage}
                  accessibilityLabel={`Image attachment: ${hasAttachment.fileName}`}
                />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.attachmentDocument}>
                <Icon
                  name={getFileIcon(
                    hasAttachment.fileName,
                    hasAttachment.fileType
                  )}
                  size={20}
                  color={isSent ? "#fff" : "#1e293b"}
                />
                <Text style={styles.attachmentName}>
                  {hasAttachment.fileName}
                </Text>
                <Text style={styles.attachmentSize}>
                  {formatBytes(hasAttachment.fileSize)}
                </Text>
              </TouchableOpacity>
            ))}
          <Text
            style={[
              styles.messageTime,
              isSent ? styles.sentMessageTime : styles.receivedMessageTime,
            ]}
          >
            {formatMessageTime(
              msg.createdAt || msg.sentAt || msg.timestamp || msg.creationDate
            )}
          </Text>
        </View>
      </View>
    );
  };

  let filteredConsultants = preSelectedConsultant
    ? [
        ...clinicConsultants.filter(
          (c) => c.user.id !== preSelectedConsultant?.user.id
        ),
        ...consultants.filter((c) => {
          const consultantId = c.user?.id || c.id;
          return (
            chatThreads[consultantId] &&
            !clinicConsultants.some((clinic) => clinic.user.id === consultantId)
          );
        }),
      ]
    : consultants.filter((c) => {
        const consultantId = c.user?.id || c.id;
        return chatThreads[consultantId];
      });

  if (searchTerm) {
    filteredConsultants = filteredConsultants.filter(
      (c) =>
        c.user?.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.specialization?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  const activeThread =
    selectedConsultant && chatThreads[selectedConsultant.user.id]
      ? chatThreads[selectedConsultant.user.id].thread
      : null;
  const activeMessages =
    selectedConsultant && chatThreads[selectedConsultant.user.id]
      ? chatThreads[selectedConsultant.user.id].messages
      : [];
  const consultantProfile =
    selectedConsultant && chatThreads[selectedConsultant.user.id]
      ? chatThreads[selectedConsultant.user.id].consultant
      : null;

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading Consultation...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      >
        <View style={styles.content}>
          {/* Consultant Header */}
          {selectedConsultant ? (
            <View style={styles.consultantHeader}>
              <View style={styles.headerButtonContainer}>
                <TouchableOpacity
                  style={styles.headerButton}
                  onPress={() =>
                    navigation.navigate("ClinicDetail", {
                      clinicId: clinicInfo?.id,
                    })
                  }
                  accessibilityLabel="Go back to clinic details"
                >
                  <Icon name="arrow-left" size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.headerButton}
                  onPress={() => setIsSidebarOpen(true)}
                  accessibilityLabel="Open consultant list"
                >
                  <Icon name="bars" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
              <View style={styles.consultantDetails}>
                <Image
                  source={{
                    uri:
                      consultantProfile?.user?.avatar?.fileUrl ||
                      "https://via.placeholder.com/150",
                  }}
                  style={styles.consultantAvatarLarge}
                  accessibilityLabel={`Avatar of ${consultantProfile?.user?.userName}`}
                />
                <View style={styles.consultantMeta}>
                  <Text style={styles.consultantName}>
                    {consultantProfile?.user?.userName}
                  </Text>
                  <Text style={styles.consultantSpecialization}>
                    {consultantProfile?.specialization}
                  </Text>
                  <View style={styles.clinicInfo}>
                    <Icon name="hospital-o" size={14} color="#fff" />
                    <Text style={styles.clinicName}>
                      {consultantProfile?.clinic?.user?.userName ||
                        consultantProfile?.clinic?.name}
                    </Text>
                  </View>
                </View>
              </View>
              {!activeThread && (
                <TouchableOpacity
                  style={[
                    styles.startButton,
                    startingChat && styles.disabledButton,
                  ]}
                  onPress={handleStartChat}
                  disabled={startingChat}
                  accessibilityLabel="Start consultation"
                >
                  <Text style={styles.startButtonText}>
                    {startingChat ? "Starting..." : "Start Chat"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.noSelection}>
              <Icon name="user" size={60} color="#8E8E93" />
              <Text style={styles.noSelectionTitle}>Select a Consultant</Text>
              <Text style={styles.noSelectionText}>
                Choose a consultant to start a conversation
              </Text>
              <TouchableOpacity
                style={styles.selectConsultantButton}
                onPress={() => setIsSidebarOpen(true)}
                accessibilityLabel="Open consultant list"
              >
                <Text style={styles.selectConsultantButtonText}>
                  View Consultants
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Messages Area */}
          {selectedConsultant && activeThread ? (
            <>
              <ScrollView
                style={styles.messages}
                contentContainerStyle={styles.messagesContent}
                ref={messagesEndRef}
                onContentSizeChange={() => scrollToBottom()}
              >
                {activeMessages.length === 0 ? (
                  <View style={styles.emptyMessages}>
                    <Icon name="comments" size={50} color="#8E8E93" />
                    <Text style={styles.emptyMessagesTitle}>
                      No Messages Yet
                    </Text>
                    <Text style={styles.emptyMessagesText}>
                      Start your conversation with{" "}
                      {consultantProfile?.user?.userName}
                    </Text>
                  </View>
                ) : (
                  activeMessages.map((msg, idx) => renderMessage(msg, idx))
                )}
              </ScrollView>
              <View style={styles.inputArea}>
                <View style={styles.inputContainer}>
                  {selectedFile && (
                    <View style={styles.filePreview}>
                      {filePreview ? (
                        <Image
                          source={{ uri: filePreview }}
                          style={styles.filePreviewImage}
                        />
                      ) : (
                        <View style={styles.filePreviewDocument}>
                          <Icon name="file" size={16} color="#007AFF" />
                          <Text style={styles.filePreviewText}>
                            {selectedFile.name}
                          </Text>
                        </View>
                      )}
                      <TouchableOpacity
                        style={styles.filePreviewRemove}
                        onPress={clearSelectedFile}
                        accessibilityLabel="Remove attachment"
                      >
                        <Icon name="times" size={16} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  )}
                  <View style={styles.inputRow}>
                    <TouchableOpacity
                      style={styles.attachmentButton}
                      onPress={handleFileSelect}
                      accessibilityLabel="Attach image"
                    >
                      <Icon name="paperclip" size={24} color="#007AFF" />
                    </TouchableOpacity>
                    <TextInput
                      style={styles.input}
                      placeholder="Type a message..."
                      value={newMessage}
                      onChangeText={setNewMessage}
                      multiline
                      placeholderTextColor="#8E8E93"
                      accessibilityLabel="Message input"
                    />
                    <TouchableOpacity
                      style={[
                        styles.sendButton,
                        (!newMessage.trim() && !selectedFile) || sendingMessage
                          ? styles.disabledButton
                          : {},
                      ]}
                      onPress={handleSendMessage}
                      disabled={
                        (!newMessage.trim() && !selectedFile) || sendingMessage
                      }
                      accessibilityLabel="Send message"
                    >
                      <MaterialIcons name="send" size={24} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </>
          ) : selectedConsultant && !activeThread ? (
            <View style={styles.noThread}>
              <Icon name="chat" size={60} color="#8E8E93" />
              <Text style={styles.noThreadTitle}>No Active Chat</Text>
              <Text style={styles.noThreadText}>
                Start a consultation to message this consultant.
              </Text>
            </View>
          ) : null}

          {/* Consultant List Sidebar (Modal) */}
          <Modal
            visible={isSidebarOpen}
            animationType="none"
            transparent={true}
            onRequestClose={() => setIsSidebarOpen(false)}
          >
            <TouchableWithoutFeedback onPress={() => setIsSidebarOpen(false)}>
              <View style={styles.modalOverlay}>
                <Animated.View
                  style={[
                    styles.sidebar,
                    { transform: [{ translateX: sidebarAnim }] },
                  ]}
                >
                  <SafeAreaView style={styles.sidebarContainer}>
                    <View style={styles.sidebarHeader}>
                      <Text style={styles.sidebarHeaderText}>Consultants</Text>
                      <TouchableOpacity
                        onPress={() => setIsSidebarOpen(false)}
                        accessibilityLabel="Close consultant list"
                      >
                        <Icon name="times" size={24} color="#fff" />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.searchSection}>
                      <View style={styles.searchBar}>
                        <Icon
                          name="search"
                          size={16}
                          color="#8E8E93"
                          style={styles.searchIcon}
                        />
                        <TextInput
                          style={styles.searchInput}
                          placeholder="Search consultants..."
                          value={searchTerm}
                          onChangeText={setSearchTerm}
                          placeholderTextColor="#8E8E93"
                          accessibilityLabel="Search consultants"
                        />
                      </View>
                    </View>
                    <FlatList
                      data={filteredConsultants}
                      keyExtractor={(item) => `consultant-${item.user.id}`}
                      renderItem={({ item }) => {
                        const profile =
                          chatThreads[item.user.id]?.consultant || item;
                        const thread = chatThreads[item.user.id];
                        return (
                          <TouchableOpacity
                            style={[
                              styles.consultantItem,
                              selectedConsultant?.user.id === item.user.id &&
                                styles.activeConsultantItem,
                            ]}
                            onPress={() => handleSelectConsultant(item)}
                            accessibilityLabel={`Select consultant ${profile?.user?.userName}`}
                          >
                            <Image
                              source={{
                                uri:
                                  profile?.user?.avatar?.fileUrl ||
                                  "https://via.placeholder.com/150",
                              }}
                              style={styles.consultantAvatar}
                            />
                            <View style={styles.consultantInfo}>
                              <Text style={styles.consultantInfoName}>
                                {profile?.user?.userName}
                              </Text>
                              <Text style={styles.consultantSpecialization}>
                                {profile?.specialization}
                              </Text>
                              <View style={styles.consultantClinic}>
                                <Icon
                                  name="hospital-o"
                                  size={12}
                                  color="#007AFF"
                                />
                                <Text style={styles.consultantClinicName}>
                                  {profile?.clinic?.user?.userName ||
                                    profile?.clinic?.name}
                                </Text>
                              </View>
                              {thread?.thread?.updatedAt && (
                                <View style={styles.lastActivity}>
                                  <Icon
                                    name="clock-o"
                                    size={12}
                                    color="#8E8E93"
                                  />
                                  <Text style={styles.lastActivityText}>
                                    {new Date(
                                      thread.thread.updatedAt
                                    ).toLocaleDateString()}
                                  </Text>
                                </View>
                              )}
                            </View>
                            <View
                              style={[
                                styles.statusIndicator,
                                thread && styles.activeStatusIndicator,
                              ]}
                            />
                          </TouchableOpacity>
                        );
                      }}
                      ListEmptyComponent={
                        <View style={styles.emptyThreadList}>
                          <Icon name="comments" size={50} color="#8E8E93" />
                          <Text style={styles.emptyThreadListTitle}>
                            No Conversations
                          </Text>
                          <Text style={styles.emptyThreadListText}>
                            {searchTerm
                              ? "No consultants match your search."
                              : "Start a consultation from a clinic page."}
                          </Text>
                        </View>
                      }
                      ListFooterComponent={
                        filteredConsultants.length > 0 ? (
                          <View style={styles.listFooter}>
                            <Text style={styles.listFooterText}>
                              No more consultant chats here
                            </Text>
                          </View>
                        ) : null
                      }
                      contentContainerStyle={styles.flatListContent}
                    />
                  </SafeAreaView>
                </Animated.View>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  keyboardContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  consultantHeader: {
    backgroundColor: "#007AFF",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    margin: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerButton: {
    padding: 10,
    marginRight: 10,
  },
  consultantDetails: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  consultantAvatarLarge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.8)",
  },
  consultantMeta: {
    flex: 1,
  },
  consultantName: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  consultantSpecialization: {
    color: "#fff",
    fontSize: 14,
    opacity: 0.9,
  },
  clinicInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  clinicName: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "500",
  },
  startButton: {
    backgroundColor: "#fff",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    minWidth: 100,
    alignItems: "center",
  },
  startButtonText: {
    color: "#007AFF",
    fontSize: 15,
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.5,
  },
  messages: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 120,
  },
  message: {
    marginBottom: 12,
    width: "100%",
  },
  sentMessage: {
    alignItems: "flex-end",
  },
  receivedMessage: {
    alignItems: "flex-start",
  },
  messageContent: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sentMessageContent: {
    backgroundColor: "#007AFF",
    borderBottomRightRadius: 4,
  },
  receivedMessageContent: {
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    color: "#000",
  },
  sentMessageText: {
    color: "#fff",
  },
  receivedMessageText: {
    color: "#000",
  },
  messageTime: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 6,
  },
  sentMessageTime: {
    color: "#fff",
    textAlign: "right",
  },
  receivedMessageTime: {
    color: "#8E8E93",
    textAlign: "left",
  },
  attachmentImage: {
    width: 200,
    height: 150,
    borderRadius: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },
  attachmentDocument: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 10,
    marginTop: 8,
  },
  attachmentName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#fff",
  },
  attachmentSize: {
    fontSize: 12,
    color: "#fff",
    opacity: 0.7,
  },
  inputArea: {
    padding: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E5E5EA",
  },
  inputContainer: {
    backgroundColor: "#F2F2F7",
    borderRadius: 20,
    padding: 8,
  },
  filePreview: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 8,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  filePreviewImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  filePreviewDocument: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 8,
  },
  filePreviewText: {
    fontSize: 14,
    color: "#000",
  },
  filePreviewRemove: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#FF3B30",
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  attachmentButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    fontSize: 16,
    padding: 12,
    borderRadius: 20,
    backgroundColor: "#fff",
    maxHeight: 120,
    color: "#000",
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#007AFF",
    alignItems: "center",
    justifyContent: "center",
  },
  noSelection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  noSelectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000",
    marginVertical: 12,
  },
  noSelectionText: {
    fontSize: 16,
    color: "#8E8E93",
    textAlign: "center",
    marginBottom: 16,
  },
  selectConsultantButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  selectConsultantButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  noThread: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  noThreadTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000",
    marginVertical: 12,
  },
  noThreadText: {
    fontSize: 16,
    color: "#8E8E93",
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  sidebar: {
    width: width * 0.8,
    height: "100%",
    backgroundColor: "#fff",
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
  },
  sidebarContainer: {
    flex: 1,
  },
  sidebarHeader: {
    backgroundColor: "#007AFF",
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopRightRadius: 16,
  },
  sidebarHeaderText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
  },
  searchSection: {
    padding: 12,
    backgroundColor: "#fff",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F2F7",
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 10,
    color: "#000",
  },
  consultantItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  activeConsultantItem: {
    backgroundColor: "#F2F2F7",
  },
  consultantAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  consultantInfo: {
    flex: 1,
  },
  consultantInfoName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  consultantSpecialization: {
    fontSize: 14,
    color: "#8E8E93",
    marginVertical: 2,
  },
  consultantClinic: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  consultantClinicName: {
    fontSize: 13,
    color: "#007AFF",
  },
  lastActivity: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  lastActivityText: {
    fontSize: 12,
    color: "#8E8E93",
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#FF3B30",
  },
  activeStatusIndicator: {
    backgroundColor: "#34C759",
  },
  emptyThreadList: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  emptyThreadListTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000",
    marginVertical: 12,
  },
  emptyThreadListText: {
    fontSize: 16,
    color: "#8E8E93",
    textAlign: "center",
    maxWidth: 300,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F2F2F7",
  },
  loadingText: {
    fontSize: 16,
    color: "#007AFF",
    marginTop: 8,
  },
  flatListContent: {
    paddingBottom: 20,
  },
  listFooter: {
    padding: 16,
    alignItems: "center",
  },
  listFooterText: {
    fontSize: 14,
    color: "#8E8E93",
    textAlign: "center",
  },
});

export default ConsultationChat;
