import React, { useState, useEffect, useRef } from 'react';
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
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/FontAwesome';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import BottomSheet from '@gorhom/bottom-sheet';
import * as signalR from '@microsoft/signalr';
import {
  startChatThread,
  sendMessage,
  getChatThreadByUserId,
  getChatThreadById,
} from "../api/message-api";
import { viewConsultantByUserId } from "../api/consultant-api";
import { getCurrentUser } from "../api/auth";
import { getAllClinics } from "../api/clinic-api";
import { useMessages } from '../contexts/MessageContext'; // Adjust path as needed

const { width, height } = Dimensions.get('window');

const ConsultationChat = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const messagesEndRef = useRef(null);
  const bottomSheetRef = useRef(null);
  const { connection, messages, addMessage } = useMessages();
  const {
    selectedConsultant: preSelectedConsultant,
    currentUserId: passedUserId,
    clinicConsultants = [],
    clinicInfo = null,
  } = route.params || {};
  const [currentUserId, setCurrentUserId] = useState(passedUserId || '');
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [consultants, setConsultants] = useState([]);
  const [chatThreads, setChatThreads] = useState({});
  const [selectedConsultant, setSelectedConsultant] = useState(preSelectedConsultant || null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [startingChat, setStartingChat] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const fileInputRef = useRef(null);

  // Scroll to bottom
  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollToEnd({ animated: true });
    });
  };

  // Format file size
  const formatBytes = (bytes) => {
    if (!bytes && bytes !== 0) return '';
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0, n = bytes;
    while (n >= 1024 && i < units.length - 1) {
      n /= 1024;
      i++;
    }
    return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
  };

  // Map mime/extension to icon
  const getFileIcon = (fileName, fileType) => {
    const name = (fileName || '').toLowerCase();
    const type = (fileType || '').toLowerCase();
    if (type.includes('pdf') || name.endsWith('.pdf')) return 'file-pdf-o';
    if (type.includes('word') || name.endsWith('.doc') || name.endsWith('.docx')) return 'file-word-o';
    if (type.includes('excel') || name.endsWith('.xls') || name.endsWith('.xlsx')) return 'file-excel-o';
    if (type.startsWith('text/') || name.endsWith('.txt') || name.endsWith('.log')) return 'file-text-o';
    return 'file';
  };

  // Supported file types
  const supportedImageTypes = ['.jpg', '.jpeg', '.png'];
  const supportedDocTypes = ['.docx', '.xls', '.xlsx', '.pdf'];
  const allSupportedTypes = [...supportedImageTypes, ...supportedDocTypes];

  useEffect(() => {
    initializePage();
  }, []);

  const initializePage = async () => {
    try {
      let userId = passedUserId;
      if (!userId) {
        const token = await AsyncStorage.getItem('token'); // Use AsyncStorage for React Native
        if (!token) {
          navigation.navigate('SignIn');
          return;
        }
        const userRes = await getCurrentUser(token);
        userId = userRes?.data?.data?.id || userRes?.data?.id || userRes?.id || '';
        if (!userId) {
          navigation.navigate('SignIn');
          return;
        }
      }
      setCurrentUserId(userId);
      await loadAllConsultants();
      await loadExistingThreads(userId);
    } catch (error) {
      console.error('Failed to initialize consultation chat:', error);
      navigation.navigate('SignIn');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (preSelectedConsultant && !loading) {
      const consultantId = preSelectedConsultant.user?.id;
      if (consultantId && !chatThreads[consultantId]) {
        setChatThreads((prevThreads) => ({
          ...prevThreads,
          [consultantId]: {
            thread: null,
            messages: [],
            consultant: preSelectedConsultant,
          },
        }));
        setSelectedConsultant(preSelectedConsultant);
      }
    }
  }, [preSelectedConsultant, loading, chatThreads]);

  const loadExistingThreads = async (userId) => {
    try {
      const token = await AsyncStorage.getItem('token');
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
            const consultantRes = await viewConsultantByUserId(consultantId, token);
            const consultantData = consultantRes?.data || null;
            const processedMessages = thread.messages?.map((msg) => {
              if (msg.attachmentUrl || msg.attachmentPath || msg.attachment) {
                return {
                  ...msg,
                  attachment: {
                    fileName: msg.attachmentFileName || msg.fileName || 'Attachment',
                    fileSize: msg.attachmentFileSize || msg.fileSize,
                    fileType: msg.attachmentFileType || msg.fileType,
                    isImage: isImageFile(msg.attachmentFileName || msg.fileName),
                    url: msg.attachmentUrl || msg.attachmentPath || msg.attachment?.url,
                  },
                };
              }
              if (msg.media && Array.isArray(msg.media) && msg.media.length > 0) {
                const firstMedia = msg.media[0];
                return {
                  ...msg,
                  attachment: {
                    fileName: firstMedia.fileName || 'Attachment',
                    fileSize: firstMedia.fileSize,
                    fileType: firstMedia.fileType,
                    isImage: isImageFile(firstMedia.fileName || ''),
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
        setChatThreads(threadsMap);
      }
    } catch (error) {
      console.error('Failed to load existing threads:', error);
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
      console.error('Failed to load consultants:', error);
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
      clinic: consultant.clinic?.address && consultant.clinic?.name
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
    setNewMessage('');
  };

  const handleStartChat = async () => {
    if (!selectedConsultant) return;
    const consultantId = selectedConsultant.user.id;
    if (chatThreads[consultantId]?.thread) {
      return;
    }
    try {
      setStartingChat(true);
      const token = await AsyncStorage.getItem('token');
      const threadData = { userId: currentUserId, consultantId };
      const createdThread = await startChatThread(threadData, token);
      const threadId = createdThread?.data?.id || createdThread?.data?.chatThreadId || createdThread?.chatThreadId;
      if (!threadId) {
        console.error('No threadId found in response:', createdThread);
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
      console.error('Failed to start chat thread:', error);
    } finally {
      setStartingChat(false);
    }
  };

  const handleFileSelect = async () => {
    // Implement file picker logic (e.g., using react-native-document-picker)
    // For simplicity, we'll assume a similar file selection mechanism
    // This is a placeholder; you'll need to integrate a file picker library
    alert('File picker not implemented in this example. Please integrate a file picker library.');
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
  };

  const isImageFile = (fileName) => {
    if (!fileName) return false;
    const extension = '.' + fileName.toLowerCase().split('.').pop();
    return supportedImageTypes.includes(extension);
  };

  const handleSendMessage = async () => {
    if (!connection || connection.state !== signalR.HubConnectionState.Connected) {
      alert('Connection lost. Please refresh the app.');
      return;
    }
    const consultantId = selectedConsultant?.user?.id;
    const activeThread = consultantId && chatThreads[consultantId] ? chatThreads[consultantId].thread : null;
    if ((!newMessage.trim() && !selectedFile) || !activeThread || sendingMessage) return;
    try {
      setSendingMessage(true);
      const token = await AsyncStorage.getItem('token');
      const formData = new FormData();
      formData.append('ChatThreadId', activeThread.id);
      formData.append('SenderId', currentUserId);
      if (newMessage.trim()) {
        formData.append('MessageText', newMessage.trim());
      }
      if (selectedFile) {
        formData.append('Attachments', selectedFile);
        formData.append('AttachmentFileName', selectedFile.name);
        formData.append('AttachmentFileType', selectedFile.type);
        formData.append('AttachmentFileSize', selectedFile.size.toString());
      }
      const response = await sendMessage(formData, token);
      if (response.error === 0) {
        const attachmentUrl = response.data?.attachmentUrl || response.data?.attachmentPath || response.data?.attachment?.url;
        const newMsg = {
          id: response.data?.id || Date.now().toString(),
          senderId: currentUserId,
          receiverId: consultantId,
          messageText: newMessage.trim() || '',
          createdAt: response.data?.sentAt || new Date().toISOString(),
          messageType: selectedFile ? 'attachment' : 'text',
          isRead: false,
          attachment: selectedFile ? {
            fileName: selectedFile.name,
            fileSize: selectedFile.size,
            fileType: selectedFile.type,
            isImage: isImageFile(selectedFile.name),
            url: attachmentUrl || filePreview,
          } : null,
        };
        setChatThreads((prevThreads) => ({
          ...prevThreads,
          [consultantId]: {
            ...prevThreads[consultantId],
            messages: [...(prevThreads[consultantId]?.messages || []), newMsg],
          },
        }));
        setNewMessage('');
        clearSelectedFile();
        setTimeout(() => scrollToBottom(), 100);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSendingMessage(false);
    }
  };

  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    try {
      let utcDate;
      if (typeof timestamp === 'string') {
        utcDate = new Date(timestamp.endsWith('Z') ? timestamp : timestamp + 'Z');
      } else if (typeof timestamp === 'number') {
        utcDate = timestamp > 1000000000000 ? new Date(timestamp) : new Date(timestamp * 1000);
      } else if (timestamp instanceof Date) {
        utcDate = timestamp;
      } else {
        return '';
      }
      if (isNaN(utcDate.getTime())) {
        console.warn('Invalid timestamp:', timestamp);
        return '';
      }
      return utcDate.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      console.warn('Error formatting timestamp:', error);
      return '';
    }
  };

  const renderMessage = (msg, idx) => {
    const isSent = msg.senderId === currentUserId;
    const hasAttachment = msg.attachment;
    return (
      <View key={idx} style={[styles.message, isSent ? styles.sentMessage : styles.receivedMessage]}>
        <View style={[styles.messageContent, isSent ? styles.sentMessageContent : styles.receivedMessageContent]}>
          {(msg.messageText || msg.message) && (
            <Text style={[styles.messageText, isSent ? styles.sentMessageText : styles.receivedMessageText]}>
              {msg.messageText || msg.message}
            </Text>
          )}
          {hasAttachment && (
            hasAttachment.isImage ? (
              <TouchableOpacity onPress={() => { /* Open image in browser or viewer */ }}>
                <Image
                  source={{ uri: hasAttachment.url }}
                  style={styles.attachmentImage}
                />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.attachmentDocument}>
                <Icon name={getFileIcon(hasAttachment.fileName, hasAttachment.fileType)} size={18} color={isSent ? '#fff' : '#1e293b'} />
                <Text style={styles.attachmentName}>{hasAttachment.fileName}</Text>
              </TouchableOpacity>
            )
          )}
          <Text style={[styles.messageTime, isSent ? styles.sentMessageTime : styles.receivedMessageTime]}>
            {formatMessageTime(msg.createdAt || msg.sentAt || msg.timestamp || msg.creationDate)}
          </Text>
        </View>
      </View>
    );
  };

  let filteredConsultants = preSelectedConsultant
    ? [
        ...clinicConsultants.filter((c) => c.user.id !== preSelectedConsultant?.user.id),
        ...consultants.filter((c) => {
          const consultantId = c.user?.id || c.id;
          return chatThreads[consultantId] && !clinicConsultants.some((clinic) => clinic.user.id === consultantId);
        }),
      ]
    : consultants.filter((c) => {
        const consultantId = c.user?.id || c.id;
        return chatThreads[consultantId];
      });

  const activeThread = selectedConsultant && chatThreads[selectedConsultant.user.id]
    ? chatThreads[selectedConsultant.user.id].thread
    : null;
  const activeMessages = selectedConsultant && chatThreads[selectedConsultant.user.id]
    ? chatThreads[selectedConsultant.user.id].messages
    : [];
  const consultantProfile = selectedConsultant && chatThreads[selectedConsultant.user.id]
    ? chatThreads[selectedConsultant.user.id].consultant
    : null;

 

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <View style={styles.content}>
        {/* Consultant Header */}
        {selectedConsultant ? (
          <LinearGradient
            colors={['#1c80a2', '#167995']}
            style={styles.consultantHeader}
          >
            <View style={styles.consultantDetails}>
              <TouchableOpacity onPress={() => setIsSidebarOpen(true)}>
                <Icon name="bars" size={24} color="#fff" />
              </TouchableOpacity>
              <Image
                source={{
                  uri: consultantProfile?.user?.avatar?.fileUrl ||
                    'https://www.placeholderimage.online/placeholder/420/310/ffffff/ededed?text=image&font=Lato.png',
                }}
                style={styles.consultantAvatarLarge}
              />
              <View style={styles.consultantMeta}>
                <Text style={styles.consultantName}>{consultantProfile?.user?.userName}</Text>
                <Text style={styles.consultantSpecialization}>{consultantProfile?.specialization}</Text>
                <View style={styles.clinicInfo}>
                  <Icon name="hospital-o" size={14} color="#fff" />
                  <Text style={styles.clinicName}>
                    {consultantProfile?.clinic?.user?.userName || consultantProfile?.clinic?.name}
                  </Text>
                </View>
                <Text style={styles.clinicAddress}>{consultantProfile?.clinic?.address}</Text>
              </View>
            </View>
            <View style={styles.actions}>
              {!activeThread ? (
                <TouchableOpacity
                  style={[styles.startButton, startingChat && styles.disabledButton]}
                  onPress={handleStartChat}
                  disabled={startingChat}
                >
                  <Text style={styles.startButtonText}>
                    {startingChat ? 'Starting Chat...' : 'Start Consultation'}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </LinearGradient>
        ) : (
          <View style={styles.noSelection}>
            <Icon name="user" size={80} color="#94a3b8" />
            <Text style={styles.noSelectionTitle}>Select a Consultant</Text>
            <Text style={styles.noSelectionText}>
              Choose a consultant from the list to view or start a consultation chat.
            </Text>
            <TouchableOpacity style={styles.selectConsultantButton} onPress={() => setIsSidebarOpen(true)}>
              <Text style={styles.selectConsultantButtonText}>Open Consultant List</Text>
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
                  <Icon name="comments" size={60} color="#94a3b8" />
                  <Text style={styles.emptyMessagesTitle}>Start your conversation</Text>
                  <Text style={styles.emptyMessagesText}>
                    Send a message to begin your consultation with {consultantProfile?.user?.userName}
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
                      <Image source={{ uri: filePreview }} style={styles.filePreviewImage} />
                    ) : (
                      <View style={styles.filePreviewDocument}>
                        <Icon name="file" size={14} color="#167995" />
                        <Text style={styles.filePreviewText}>{selectedFile.name}</Text>
                      </View>
                    )}
                    <TouchableOpacity style={styles.filePreviewRemove} onPress={clearSelectedFile}>
                      <Icon name="times" size={12} color="#fff" />
                    </TouchableOpacity>
                  </View>
                )}
                <View style={styles.inputRow}>
                  <TouchableOpacity style={styles.attachmentButton} onPress={handleFileSelect}>
                    <Icon name="paperclip" size={24} color="#167995" />
                  </TouchableOpacity>
                  <TextInput
                    style={styles.input}
                    placeholder="Type your message..."
                    value={newMessage}
                    onChangeText={setNewMessage}
                    multiline
                    placeholderTextColor="#94a3b8"
                  />
                  <TouchableOpacity
                    style={[styles.sendButton, (!newMessage.trim() && !selectedFile) || sendingMessage ? styles.disabledButton : {}]}
                    onPress={handleSendMessage}
                    disabled={(!newMessage.trim() && !selectedFile) || sendingMessage}
                  >
                    <MaterialIcons name="send" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </>
        ) : selectedConsultant && !activeThread ? (
          <View style={styles.noThread}>
            <Icon name="user" size={80} color="#94a3b8" />
            <Text style={styles.noThreadTitle}>No Active Thread</Text>
            <Text style={styles.noThreadText}>
              Start a consultation to begin messaging this consultant.
            </Text>
          </View>
        ) : null}

        {/* Consultant List Bottom Sheet */}
        <BottomSheet
          ref={bottomSheetRef}
          index={isSidebarOpen ? 1 : -1}
          snapPoints={['25%', '75%']}
          onChange={(index) => setIsSidebarOpen(index >= 0)}
        >
          <View style={styles.sidebar}>
            <LinearGradient colors={['#1c80a2', '#167995']} style={styles.sidebarHeader}>
              <Text style={styles.sidebarHeaderText}>Available Consultants</Text>
            </LinearGradient>
            <View style={styles.searchSection}>
              <View style={styles.searchBar}>
                <Icon name="search" size={16} color="#64748b" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search consultants..."
                  value={searchTerm}
                  onChangeText={setSearchTerm}
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>
            <FlatList
              data={filteredConsultants}
              keyExtractor={(item) => `consultant-${item.user.id}`}
              renderItem={({ item }) => {
                const profile = chatThreads[item.user.id]?.consultant || item;
                const thread = chatThreads[item.user.id];
                return (
                  <TouchableOpacity
                    style={[styles.consultantItem, selectedConsultant?.user.id === item.user.id && styles.activeConsultantItem]}
                    onPress={() => handleSelectConsultant(item)}
                  >
                    <Image
                      source={{
                        uri: profile?.user?.avatar?.fileUrl ||
                          'https://www.placeholderimage.online/placeholder/420/310/ffffff/ededed?text=image&font=Lato.png',
                      }}
                      style={styles.consultantAvatar}
                    />
                    <View style={styles.consultantInfo}>
                      <Text style={styles.consultantInfoName}>{profile?.user?.userName}</Text>
                      <Text style={styles.consultantSpecialization}>{profile?.specialization}</Text>
                      <View style={styles.consultantClinic}>
                        <Icon name="hospital-o" size={12} color="#1c7d98" />
                        <Text style={styles.consultantClinicName}>
                          {profile?.clinic?.user?.userName || profile?.clinic?.name}
                        </Text>
                      </View>
                      {thread?.thread?.updatedAt && (
                        <View style={styles.lastActivity}>
                          <Icon name="clock-o" size={12} color="#666" />
                          <Text style={styles.lastActivityText}>
                            {new Date(thread.thread.updatedAt).toLocaleDateString()}
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={[styles.statusIndicator, thread && styles.activeStatusIndicator]} />
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyThreadList}>
                  <Icon name="comments" size={60} color="#94a3b8" />
                  <Text style={styles.emptyThreadListTitle}>No Chat History</Text>
                  <Text style={styles.emptyThreadListText}>
                    {searchTerm
                      ? 'No consultants match your search criteria.'
                      : 'You haven\'t started any consultations yet. Visit a clinic\'s page and click \'Start Consultation\' with a consultant to begin.'}
                  </Text>
                </View>
              }
            />
          </View>
        </BottomSheet>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
    padding: 10,
  },
  consultantHeader: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  consultantDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  consultantAvatarLarge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  consultantMeta: {
    flex: 1,
  },
  consultantName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  consultantSpecialization: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.8,
  },
  clinicInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 6,
  },
  clinicName: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
  clinicAddress: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.8,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  startButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  messages: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  messagesContent: {
    padding: 20,
    paddingBottom: 100,
  },
  message: {
    marginBottom: 15,
    width: '100%',
  },
  sentMessage: {
    alignItems: 'flex-end',
  },
  receivedMessage: {
    alignItems: 'flex-start',
  },
  messageContent: {
    maxWidth: '75%',
    padding: 15,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  sentMessageContent: {
    backgroundColor: '#167995',
    borderBottomRightRadius: 6,
  },
  receivedMessageContent: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  sentMessageText: {
    color: '#fff',
  },
  receivedMessageText: {
    color: '#1e293b',
  },
  messageTime: {
    fontSize: 11,
    opacity: 0.7,
    marginTop: 8,
  },
  sentMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  receivedMessageTime: {
    color: 'rgba(30, 41, 59, 0.7)',
    textAlign: 'left',
  },
  attachmentImage: {
    maxWidth: 200,
    maxHeight: 150,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  attachmentDocument: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  attachmentName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  inputArea: {
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  inputContainer: {
    backgroundColor: '#fdfdfd',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(22, 121, 149, 0.1)',
    padding: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  filePreview: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
  },
  filePreviewImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(22, 121, 149, 0.1)',
  },
  filePreviewDocument: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(22, 121, 149, 0.2)',
  },
  filePreviewText: {
    fontSize: 13,
    color: '#1e293b',
  },
  filePreviewRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#ef4444',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  attachmentButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontSize: 14,
    padding: 12,
    borderRadius: 20,
    backgroundColor: '#fdfdfd',
    maxHeight: 100,
    color: '#1e293b',
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0d7aa5',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  disabledButton: {
    opacity: 0.5,
  },
  noSelection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'rgba(248, 249, 250, 0.5)',
  },
  noSelectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginVertical: 10,
  },
  noSelectionText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 20,
  },
  selectConsultantButton: {
    backgroundColor: '#167995',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  selectConsultantButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  noThread: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'rgba(248, 249, 250, 0.5)',
  },
  noThreadTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginVertical: 10,
  },
  noThreadText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  sidebar: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
  },
  sidebarHeader: {
    padding: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  sidebarHeaderText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  searchSection: {
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'rgba(22, 121, 149, 0.1)',
    paddingHorizontal: 15,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 12,
    color: '#1e293b',
  },
  consultantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.03)',
  },
  activeConsultantItem: {
    backgroundColor: 'rgba(22, 121, 149, 0.1)',
    borderLeftWidth: 4,
    borderLeftColor: '#167995',
  },
  consultantAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
    borderWidth: 3,
    borderColor: 'rgba(22, 121, 149, 0.1)',
  },
  consultantInfo: {
    flex: 1,
  },
  consultantInfoName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  consultantSpecialization: {
    fontSize: 12,
    color: '#64748b',
    marginVertical: 4,
  },
  consultantClinic: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  consultantClinicName: {
    fontSize: 12,
    color: '#1c7d98',
  },
  lastActivity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  lastActivityText: {
    fontSize: 12,
    color: '#666',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#fe6b6a',
    borderWidth: 2,
    borderColor: '#fff',
  },
  activeStatusIndicator: {
    backgroundColor: '#00c851',
  },
  emptyThreadList: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyThreadListTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginVertical: 10,
  },
  emptyThreadListText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    maxWidth: 300,
  },
});

export default ConsultationChat;
