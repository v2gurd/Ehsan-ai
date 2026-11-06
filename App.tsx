import React, { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CONFIG } from "./src/config";

type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

const starterPrompts = [
  "برای امروز یک برنامه مفید بچین",
  "یک ایده خلاقانه برای عکاسی بده",
  "این کد را برایم توضیح بده",
];

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "سلام! من Ehsan AI هستم. چه کاری از دستم برمیاد؟",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef<FlatList<Message>>(null);

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

  async function sendMessage(value = input) {
    const prompt = value.trim();
    if (!prompt || loading) return;

    Keyboard.dismiss();
    const userMessage: Message = {
      id: `${Date.now()}-user`,
      role: "user",
      text: prompt,
    };
    const previous = messages;
    setMessages((current) => [...current, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const history = previous
        .filter((item) => item.id !== "welcome")
        .slice(-12)
        .map((item) => ({
          role: item.role === "assistant" ? "model" : "user",
          text: item.text,
        }));

      const response = await fetch(CONFIG.functionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: CONFIG.supabasePublishableKey,
          Authorization: `Bearer ${CONFIG.supabasePublishableKey}`,
        },
        body: JSON.stringify({ message: prompt, history }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || data.message || `خطای سرور (${response.status})`);
      }
      const answer = data.reply || data.text || data.response;
      if (typeof answer !== "string" || !answer.trim()) {
        throw new Error("پاسخ معتبری از سرور دریافت نشد.");
      }

      setMessages((current) => [
        ...current,
        { id: `${Date.now()}-assistant`, role: "assistant", text: answer.trim() },
      ]);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "ارتباط با سرویس هوش مصنوعی برقرار نشد.";
      setMessages((current) => [
        ...current,
        {
          id: `${Date.now()}-error`,
          role: "assistant",
          text: `مشکلی پیش آمد: ${message}\n\nاتصال اینترنت و تنظیمات Supabase را بررسی کن.`,
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }

  function clearChat() {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: "assistant",
        text: "گفتگوی تازه شروع شد. چه چیزی توی ذهنته؟",
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#090812" />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View style={styles.logo}><Text style={styles.logoText}>E</Text></View>
            <View>
              <Text style={styles.brand}>EHSAN <Text style={styles.brandAccent}>AI</Text></Text>
              <View style={styles.statusRow}>
                <View style={styles.onlineDot} />
                <Text style={styles.status}>دستیار هوشمند شما</Text>
              </View>
            </View>
          </View>
          <Pressable onPress={clearChat} style={styles.newChatButton}>
            <Text style={styles.newChatText}>＋ گفتگوی جدید</Text>
          </Pressable>
        </View>

        <View style={styles.hero}>
          <View style={styles.orbOuter}>
            <View style={styles.orbMiddle}>
              <View style={styles.orbInner}><Text style={styles.orbLetter}>E</Text></View>
            </View>
          </View>
          <Text style={styles.heroTitle}>فکر کن. بپرس. خلق کن.</Text>
          <Text style={styles.heroSubtitle}>قدرت هوش مصنوعی، همیشه همراه تو</Text>
        </View>

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => (
            <View style={[styles.messageRow, item.role === "user" ? styles.userRow : styles.aiRow]}>
              {item.role === "assistant" && <View style={styles.avatar}><Text style={styles.avatarText}>E</Text></View>}
              <View style={[styles.bubble, item.role === "user" ? styles.userBubble : styles.aiBubble]}>
                <Text style={styles.messageText}>{item.text}</Text>
              </View>
            </View>
          )}
          ListFooterComponent={
            loading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color="#A78BFA" size="small" />
                <Text style={styles.loadingText}>Ehsan AI در حال فکر کردنه...</Text>
              </View>
            ) : null
          }
        />

        {messages.length <= 1 && (
          <View style={styles.suggestions}>
            <Text style={styles.suggestionsTitle}>از اینجا شروع کن</Text>
            {starterPrompts.map((prompt) => (
              <Pressable key={prompt} onPress={() => sendMessage(prompt)} style={styles.suggestion}>
                <Text style={styles.suggestionText}>{prompt}</Text>
                <Text style={styles.suggestionArrow}>←</Text>
              </Pressable>
            ))}
          </View>
        )}

        <View style={styles.composerWrap}>
          <View style={styles.composer}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="پیامت رو اینجا بنویس..."
              placeholderTextColor="#77738A"
              style={styles.input}
              multiline
              maxLength={6000}
              textAlign="right"
              textAlignVertical="center"
              editable={!loading}
              onSubmitEditing={() => sendMessage()}
              returnKeyType="send"
            />
            <Pressable
              onPress={() => sendMessage()}
              disabled={!canSend}
              style={[styles.sendButton, !canSend && styles.sendDisabled]}
            >
              <Text style={styles.sendIcon}>↑</Text>
            </Pressable>
          </View>
          <Text style={styles.disclaimer}>Ehsan AI ممکن است اشتباه کند. اطلاعات مهم را بررسی کن.</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#090812" },
  container: { flex: 1, backgroundColor: "#090812" },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: "#211D31" },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 11 },
  logo: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "#6D42C7", borderWidth: 1, borderColor: "#B99AFF" },
  logoText: { color: "#FFFFFF", fontSize: 24, fontWeight: "900" },
  brand: { color: "#FFFFFF", fontSize: 17, fontWeight: "900", letterSpacing: 1.5 },
  brandAccent: { color: "#B69AFF" },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 3 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#61E6B2" },
  status: { color: "#9D98B0", fontSize: 11 },
  newChatButton: { borderWidth: 1, borderColor: "#39304E", backgroundColor: "#171322", paddingHorizontal: 12, paddingVertical: 9, borderRadius: 12 },
  newChatText: { color: "#D9D0EF", fontSize: 11, fontWeight: "700" },
  hero: { alignItems: "center", paddingTop: 24, paddingBottom: 12 },
  orbOuter: { width: 94, height: 94, borderRadius: 47, borderWidth: 1, borderColor: "#6140A2", alignItems: "center", justifyContent: "center", backgroundColor: "#151025" },
  orbMiddle: { width: 74, height: 74, borderRadius: 37, borderWidth: 1, borderColor: "#8D69D0", alignItems: "center", justifyContent: "center", backgroundColor: "#24163C" },
  orbInner: { width: 54, height: 54, borderRadius: 27, backgroundColor: "#8B5CF6", alignItems: "center", justifyContent: "center" },
  orbLetter: { color: "white", fontSize: 30, fontWeight: "900" },
  heroTitle: { color: "#F4F0FF", fontSize: 20, fontWeight: "800", marginTop: 12 },
  heroSubtitle: { color: "#8D879F", fontSize: 12, marginTop: 5 },
  messageList: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10, flexGrow: 1 },
  messageRow: { flexDirection: "row", alignItems: "flex-end", marginVertical: 6, gap: 8 },
  userRow: { justifyContent: "flex-start" },
  aiRow: { justifyContent: "flex-end" },
  avatar: { width: 28, height: 28, borderRadius: 10, backgroundColor: "#7046BD", alignItems: "center", justifyContent: "center" },
  avatarText: { color: "white", fontWeight: "900" },
  bubble: { maxWidth: "86%", borderRadius: 18, paddingHorizontal: 14, paddingVertical: 11 },
  userBubble: { backgroundColor: "#29213C", borderBottomLeftRadius: 5, borderWidth: 1, borderColor: "#403256" },
  aiBubble: { backgroundColor: "#171522", borderBottomRightRadius: 5, borderWidth: 1, borderColor: "#302A40" },
  messageText: { color: "#F2EFFA", fontSize: 14, lineHeight: 23, textAlign: "right" },
  loadingRow: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 9, paddingVertical: 12, paddingHorizontal: 8 },
  loadingText: { color: "#A99BC8", fontSize: 12 },
  suggestions: { paddingHorizontal: 18, paddingBottom: 12, gap: 8 },
  suggestionsTitle: { color: "#8F89A3", fontSize: 11, textAlign: "right", marginBottom: 2 },
  suggestion: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#151220", borderColor: "#302842", borderWidth: 1, borderRadius: 13, paddingVertical: 10, paddingHorizontal: 13 },
  suggestionText: { color: "#D8D1E8", fontSize: 12 },
  suggestionArrow: { color: "#B69AFF", fontSize: 16 },
  composerWrap: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 6, borderTopWidth: 1, borderTopColor: "#211D31", backgroundColor: "#0D0B16" },
  composer: { minHeight: 54, maxHeight: 130, flexDirection: "row", alignItems: "center", backgroundColor: "#1A1725", borderWidth: 1, borderColor: "#403450", borderRadius: 18, paddingLeft: 7, paddingRight: 12 },
  input: { flex: 1, color: "#FFFFFF", fontSize: 14, paddingHorizontal: 10, paddingVertical: 10, maxHeight: 110, minHeight: 42 },
  sendButton: { width: 39, height: 39, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: "#8B5CF6" },
  sendDisabled: { opacity: 0.35 },
  sendIcon: { color: "#FFFFFF", fontSize: 25, fontWeight: "800", marginTop: -2 },
  disclaimer: { color: "#696477", fontSize: 9, textAlign: "center", paddingTop: 7, paddingBottom: 3 },
});
