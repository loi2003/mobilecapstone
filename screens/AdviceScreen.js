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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { Header } from './HomeScreen'; // Reusing the Header component

const { width } = Dimensions.get('window');

const AdviceScreen = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [activeMode, setActiveMode] = useState('ai'); // 'ai' or 'staff'
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef(null);
  const navigation = useNavigation();

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  // Handle message submission
  const handleSendMessage = async () => {
    if (!input.trim()) return;
    const userMessage = { text: input, sender: 'user', timestamp: new Date() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    if (activeMode === 'ai') {
      setTimeout(() => {
        const responseText = `AI Response: Here's advice for your question: "${input}". This is a simulated response for demonstration.`;
        setMessages((prev) => [
          ...prev,
          { text: responseText, sender: 'ai', timestamp: new Date() },
        ]);
        setIsLoading(false);
      }, 1000);
    } else {
      try {
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              text: 'Staff Response: Your question has been submitted to our team. Expect a reply soon!',
              sender: 'staff',
              timestamp: new Date(),
            },
          ]);
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error submitting to staff:', error);
        setMessages((prev) => [
          ...prev,
          {
            text: 'Error: Could not submit your question. Please try again.',
            sender: 'staff',
            timestamp: new Date(),
          },
        ]);
        setIsLoading(false);
      }
    }
  };

  // Switch between AI and Staff modes
  const switchMode = (mode) => {
    setActiveMode(mode);
    setMessages([]);
    setInput('');
  };

  return (
    <View style={styles.container}>
      <Header navigation={navigation} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animatable.View
          animation="fadeInDown"
          duration={500}
          style={styles.header}
        >
          <Text style={styles.title}>
            {activeMode === 'ai' ? 'AI Advice Chat' : 'Staff Advice Chat'}
          </Text>
          <Text style={styles.description}>
            {activeMode === 'ai'
              ? 'Chat with our AI for instant pregnancy-related advice.'
              : 'Get personalized guidance from our expert staff.'}
          </Text>
        </Animatable.View>

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
            style={[styles.modeButton, activeMode === 'staff' && styles.modeButtonActive]}
            onPress={() => switchMode('staff')}
          >
            <Text style={[styles.modeButtonText, activeMode === 'staff' && styles.modeButtonTextActive]}>
              Staff Advice
            </Text>
          </TouchableOpacity>
        </View>

        {/* Chat Container */}
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
                msg.sender === 'user' ? styles.messageUser : styles.messageBot,
              ]}
            >
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
                <Text style={styles.messageText}>{msg.text}</Text>
                <Text style={styles.messageTimestamp}>
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            </Animatable.View>
          ))}
          {isLoading && (
            <View style={[styles.message, styles.messageBot]}>
              <View style={[styles.messageContent, styles.bgAI]}>
                <View style={styles.typing}>
                  <View style={styles.dot} />
                  <View style={[styles.dot, { animationDelay: '0.2s' }]} />
                  <View style={[styles.dot, { animationDelay: '0.4s' }]} />
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Input Form */}
        <View style={styles.inputForm}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask a question..."
            placeholderTextColor="#6B7280"
            multiline
          />
          <TouchableOpacity
            style={[styles.sendButton, (!input.trim() || isLoading) && styles.sendButtonDisabled]}
            onPress={handleSendMessage}
            disabled={isLoading || !input.trim()}
          >
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

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
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 90,
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    maxWidth: '90%',
  },
  modeNav: {
    flexDirection: 'row',
    justifyContent: 'center',
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
  modeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
  },
  modeButtonTextActive: {
    color: '#ffffff',
  },
  chatContainer: {
    flex: 1,
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
    fontSize: 14,
    padding: 20,
    opacity: 0.7,
  },
  message: {
    marginBottom: 12,
    flexDirection: 'row',
  },
  messageUser: {
    justifyContent: 'flex-end',
  },
  messageBot: {
    justifyContent: 'flex-start',
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
    fontSize: 14,
    color: '#1a1a1a',
  },
  messageTimestamp: {
    fontSize: 12,
    color: '#999999',
    marginTop: 4,
    opacity: 0.8,
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
    animation: 'typing 1.2s infinite',
  },
  inputForm: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 8,
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
    fontSize: 14,
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
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginTop: 12,
  },
  linkText: {
    color: '#0084ff',
    fontWeight: '500',
  },
});

export default AdviceScreen;