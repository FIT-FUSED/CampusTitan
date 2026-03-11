import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SPACING, FONT_SIZES, FONTS, BORDER_RADIUS } from "../theme";
import { askAgent, EXAMPLE_QUERIES } from "../services/AgentService";
import { useAuth } from "../services/AuthContext";

export default function AIChatInterface({ onClose }) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      type: "assistant",
      text: "Hi! I am your CampusTitan AI Coach. Ask me anything about your health!",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef(null);

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;
    const userMessage = {
      id: Date.now().toString(),
      type: "user",
      text: text.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setLoading(true);
    try {
      const response = await askAgent(text, user?.id, {
        name: user?.name,
        age: user?.age,
        gender: user?.gender,
        proteinGoal: 60,
        weeklyGoal: 150,
      });
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        text: response.answer || "I am not sure.",
        tool: response.tool_used,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          type: "assistant",
          text: "Error. Try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = ({ item }) => {
    const isUser = item.type === "user";
    return React.createElement(
      View,
      {
        style: [
          styles.messageContainer,
          isUser ? styles.userMessage : styles.assistantMessage,
        ],
      },
      React.createElement(
        View,
        {
          style: [
            styles.messageBubble,
            isUser ? styles.userBubble : styles.assistantBubble,
          ],
        },
        !isUser &&
          React.createElement(
            View,
            { style: styles.agentHeader },
            React.createElement(Text, { style: styles.agentName }, "Titan AI"),
            item.tool &&
              React.createElement(
                Text,
                { style: styles.toolUsed },
                "via " + item.tool,
              ),
          ),
        React.createElement(
          Text,
          {
            style: [
              styles.messageText,
              isUser ? styles.userText : styles.assistantText,
            ],
          },
          item.text,
        ),
        React.createElement(
          Text,
          { style: styles.timestamp },
          item.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        ),
      ),
    );
  };

  const renderSuggestions = () => {
    return React.createElement(
      View,
      { style: styles.suggestionsContainer },
      React.createElement(
        Text,
        { style: styles.suggestionsTitle },
        "Try asking:",
      ),
      React.createElement(
        View,
        { style: styles.suggestionsList },
        EXAMPLE_QUERIES.slice(0, 4).map((query, index) =>
          React.createElement(
            TouchableOpacity,
            {
              key: index,
              style: styles.suggestionChip,
              onPress: () => sendMessage(query),
            },
            React.createElement(Text, { style: styles.suggestionText }, query),
          ),
        ),
      ),
    );
  };

  return React.createElement(
    SafeAreaView,
    { style: styles.container, edges: ["top", "left", "right", "bottom"] },
    React.createElement(
      KeyboardAvoidingView,
      {
        style: styles.body,
        behavior: Platform.OS === "ios" ? "padding" : undefined,
        keyboardVerticalOffset: Platform.OS === "ios" ? 8 : 0,
      },
      React.createElement(
        LinearGradient,
        { colors: COLORS.gradientPrimary, style: styles.header },
        React.createElement(
          TouchableOpacity,
          { onPress: onClose, style: styles.closeButton },
          React.createElement(Ionicons, {
            name: "close",
            size: 24,
            color: COLORS.textInverse,
          }),
        ),
        React.createElement(
          View,
          { style: styles.headerText },
          React.createElement(
            Text,
            { style: styles.headerTitle },
            "Titan AI Coach",
          ),
          React.createElement(
            Text,
            { style: styles.headerSubtitle },
            "Ask me anything",
          ),
        ),
      ),
      React.createElement(FlatList, {
        ref: flatListRef,
        data: messages,
        renderItem: renderMessage,
        keyExtractor: (item) => item.id,
        style: styles.list,
        contentContainerStyle: [
          styles.messagesList,
          { paddingBottom: (insets.bottom || 0) + 104 },
        ],
        ListFooterComponent: loading
          ? React.createElement(
              View,
              { style: styles.loadingContainer },
              React.createElement(ActivityIndicator, { color: COLORS.primary }),
              React.createElement(
                Text,
                { style: styles.loadingText },
                "Thinking...",
              ),
            )
          : null,
        ListHeaderComponent: messages.length === 1 ? renderSuggestions : null,
        onContentSizeChange: () => flatListRef.current?.scrollToEnd({ animated: true }),
      }),
      React.createElement(
        View,
        {
          style: [
            styles.inputContainer,
            {
              paddingBottom: Math.max(insets.bottom, SPACING.md),
            },
          ],
        },
        React.createElement(TextInput, {
          style: styles.input,
          value: inputText,
          onChangeText: setInputText,
          placeholder: "Ask...",
          placeholderTextColor: COLORS.textMuted,
          multiline: true,
          maxLength: 500,
        }),
        React.createElement(
          TouchableOpacity,
          {
            style: [
              styles.sendButton,
              (!inputText.trim() || loading) && styles.sendButtonDisabled,
            ],
            onPress: () => sendMessage(inputText),
            disabled: !inputText.trim() || loading,
          },
          React.createElement(Ionicons, {
            name: "send",
            size: 20,
            color: COLORS.textInverse,
          }),
        ),
      ),
    ),
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  body: { flex: 1 },
  list: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.lg,
    paddingTop: Platform.OS === "ios" ? 50 : 30,
  },
  closeButton: { padding: SPACING.sm },
  headerText: { marginLeft: SPACING.md },
  headerTitle: {
    color: COLORS.textInverse,
    fontSize: FONT_SIZES.xl,
    fontWeight: "bold",
  },
  headerSubtitle: {
    color: COLORS.textInverse,
    opacity: 0.8,
    fontSize: FONT_SIZES.sm,
  },
  messagesList: { padding: SPACING.md },
  messageContainer: { marginBottom: SPACING.md },
  userMessage: { alignItems: "flex-end" },
  assistantMessage: { alignItems: "flex-start" },
  messageBubble: {
    maxWidth: "80%",
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
  },
  userBubble: { backgroundColor: COLORS.primary },
  assistantBubble: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  agentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.xs,
  },
  agentName: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.xs,
    fontWeight: "bold",
  },
  toolUsed: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.xs,
    marginLeft: SPACING.sm,
  },
  messageText: { fontSize: FONT_SIZES.md, lineHeight: 22 },
  userText: { color: COLORS.textInverse },
  assistantText: { color: COLORS.text },
  timestamp: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
    alignSelf: "flex-end",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.md,
  },
  loadingText: { marginLeft: SPACING.sm, color: COLORS.textMuted },
  suggestionsContainer: { padding: SPACING.md, marginBottom: SPACING.md },
  suggestionsTitle: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.sm,
    marginBottom: SPACING.sm,
  },
  suggestionsList: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm },
  suggestionChip: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.round,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  suggestionText: { color: COLORS.primary, fontSize: FONT_SIZES.sm },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.glassBorder,
    backgroundColor: COLORS.surface,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    maxHeight: 100,
    color: COLORS.text,
    fontSize: FONT_SIZES.md,
  },
  sendButton: {
    backgroundColor: COLORS.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: SPACING.sm,
  },
  sendButtonDisabled: { opacity: 0.5 },
});
