import React, { useCallback, useMemo, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { PallyIcon } from "../ui/PallyIcon";
import { usePallyChat, type Message } from "../../hooks/usePallyChat";

interface SuggestedQuestion {
  id: string;
  text: string;
}

interface PallyBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const SUGGESTED_QUESTIONS: SuggestedQuestion[] = [
  { id: "1", text: "Where did I spend most?" },
  { id: "2", text: "Explain this graph" },
  { id: "3", text: "How's my streak?" },
];

export function PallyBottomSheet({ isOpen, onClose }: PallyBottomSheetProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const scrollViewRef = useRef<any>(null);
  const insets = useSafeAreaInsets();
  const [inputText, setInputText] = React.useState("");

  const { messages, isLoading, sendMessage, clearMessages, cancelRequest } = usePallyChat({
    onError: (error) => console.error("[Pally Chat] Error:", error),
  });

  // Snap points: 50% (open), 90% (draggable to full)
  const snapPoints = useMemo(() => ["50%", "90%"], []);

  // Expand to correct position when opened
  useEffect(() => {
    if (isOpen && bottomSheetRef.current) {
      // Delay to ensure sheet is fully mounted
      const timer = setTimeout(() => {
        bottomSheetRef.current?.expand();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      onClose();
    }
  }, [onClose]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.7}
      />
    ),
    []
  );

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd?.({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim() || isLoading) return;
    sendMessage(inputText);
    setInputText("");
    // Expand to full when sending a message
    bottomSheetRef.current?.snapToIndex(1);
  };

  const handleSuggestedQuestion = (question: string) => {
    if (isLoading) return;
    sendMessage(question);
    bottomSheetRef.current?.snapToIndex(1);
  };

  const handleClose = () => {
    cancelRequest();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={styles.handleIndicator}
      backgroundStyle={styles.sheetBackground}
      style={styles.sheet}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
    >
      {/* Main content container with flex layout */}
      <View style={styles.contentContainer}>
        {/* Fixed Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={["#FF8C32", "#FFA24C"]}
                style={styles.avatarGradient}
              >
                <View style={[styles.avatarInner, { justifyContent: 'center', alignItems: 'center' }]}>
                  <PallyIcon size={24} />
                </View>
              </LinearGradient>
              <View style={styles.onlineIndicator} />
            </View>
            <View>
              <Text style={styles.headerTitle}>Pally</Text>
              <Text style={styles.headerSubtitle}>Your money buddy</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            {messages.length > 0 && (
              <TouchableOpacity style={styles.clearButton} onPress={clearMessages}>
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <MaterialIcons name="close" size={20} color="#B0B0C3" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Scrollable Messages - takes remaining space */}
        <BottomSheetScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.messagesContent}
          style={styles.messagesScroll}
        >
          {messages.length === 0 ? (
            /* Empty state with suggestions */
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <PallyIcon size={40} />
              </View>
              <Text style={styles.emptyTitle}>Hey! I'm Pally 👋</Text>
              <Text style={styles.emptySubtitle}>
                Ask me about your spending, goals, or streaks!
              </Text>
              <View style={styles.suggestionsContainer}>
                {SUGGESTED_QUESTIONS.map((q) => (
                  <TouchableOpacity
                    key={q.id}
                    style={styles.suggestionButton}
                    onPress={() => handleSuggestedQuestion(q.text)}
                  >
                    <Text style={styles.suggestionText}>{q.text}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            /* Message list */
            <>
              {messages.map((message) => (
                <View
                  key={message.id}
                  style={[
                    styles.messageRow,
                    message.role === "user" && styles.messageRowUser,
                  ]}
                >
                  {message.role === "assistant" && (
                    <View style={styles.pallyIcon}>
                      <PallyIcon size={18} />
                    </View>
                  )}
                  <View
                    style={[
                      styles.messageBubble,
                      message.role === "assistant" ? styles.pallyBubble : styles.userBubble,
                    ]}
                  >
                    {message.role === "assistant" && !message.content ? (
                      <ActivityIndicator size="small" color="#FF8C32" />
                    ) : (
                      <Text style={styles.messageText}>{message.content}</Text>
                    )}
                  </View>
                </View>
              ))}

              {/* Typing indicator when loading and last message has content */}
              {isLoading && messages[messages.length - 1]?.content && (
                <View style={styles.typingContainer}>
                  <View style={styles.pallyIcon}>
                    <PallyIcon size={18} />
                  </View>
                  <View style={styles.typingDots}>
                    <ActivityIndicator size="small" color="#FF8C32" />
                    <Text style={styles.typingText}>Pally is thinking...</Text>
                  </View>
                </View>
              )}
            </>
          )}
        </BottomSheetScrollView>

        {/* Fixed Input at bottom */}
        <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Ask me anything..."
              placeholderTextColor="#B0B0C3"
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleSend}
              returnKeyType="send"
            />
            <TouchableOpacity
              style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!inputText.trim() || isLoading}
            >
              <MaterialIcons name="send" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheet: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 20,
  },
  sheetBackground: {
    backgroundColor: "#1A1A22",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  handleIndicator: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    width: 40,
    height: 4,
  },
  contentContainer: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarContainer: {
    position: "relative",
  },
  avatarGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    padding: 2,
    shadowColor: "#FF8C32",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 5,
  },
  avatarInner: {
    flex: 1,
    borderRadius: 22,
    backgroundColor: "#1A1A22",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEmoji: {
    fontSize: 24,
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#3DDC97",
    borderWidth: 2,
    borderColor: "#1A1A22",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  headerSubtitle: {
    color: "#FF8C32",
    fontSize: 12,
    fontWeight: "500",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  clearButtonText: {
    color: "#FF8C32",
    fontSize: 12,
    fontWeight: "600",
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  messagesScroll: {
    flex: 1,
  },
  messagesContent: {
    padding: 20,
    gap: 16,
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
  },
  messageRowUser: {
    justifyContent: "flex-end",
  },
  pallyIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 140, 50, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 140, 50, 0.2)",
    marginBottom: 4,
  },
  pallyIconEmoji: {
    fontSize: 14,
  },
  messageBubble: {
    maxWidth: "80%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
  },
  pallyBubble: {
    backgroundColor: "#0F0F14",
    borderWidth: 1,
    borderColor: "rgba(255, 140, 50, 0.8)",
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: "#FF8C32",
    borderBottomRightRadius: 4,
  },
  messageText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255, 140, 50, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 140, 50, 0.2)",
  },
  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  emptySubtitle: {
    color: "#B0B0C3",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  typingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 4,
  },
  typingDots: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  typingText: {
    color: "#B0B0C3",
    fontSize: 12,
    fontWeight: "500",
  },
  suggestionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 8,
    justifyContent: "center",
  },
  suggestionButton: {
    backgroundColor: "#2A2A35",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  suggestionText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "500",
  },
  inputContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: "#1A1A22",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.05)",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0F0F14",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    paddingLeft: 20,
    paddingRight: 6,
  },
  input: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 14,
    paddingVertical: 14,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FF8C32",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FF8C32",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 3,
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
});
