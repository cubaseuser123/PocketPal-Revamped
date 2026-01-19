import { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ScrollView, RefreshControl } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { io } from "socket.io-client";
import { useUser, useSplitGroupDetails, API_URL } from "../../hooks/useApi"; 

export default function SplitGroupChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { user } = useUser();
  const scrollViewRef = useRef<ScrollView>(null);

  // Parse Params - expecting 'id' mainly
  const groupId = params.id as string; 
  // Fallback params valid only if creating new group, but selector navigates with ID now.
  
  const { group, expenses, loading, refetch } = useSplitGroupDetails(groupId);
  
  // Derived state
  const isPayer = group?.creator?._id === user?.id; // Creator is the one who paid initially
  const role = isPayer ? "payer" : "ower";
  // My expense is where I am the OWER
  const myExpense = expenses?.find(e => e.ower?._id === user?.id);
  const myAmount = myExpense ? myExpense.amount : 0;
  const totalAmount = group?.totalAmount || 0;
  const payeeName = group?.name || "Split Bill";

  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");

  // Sync real data to messages logic (Simplified for now)
  useEffect(() => {
    if (!group) return;

    // Initial System Message
    const initialMessages: any[] = [
        { id: "1", type: "system", text: `Split group "${group.name}" created` },
    ];

    // Bill Card always visible
    initialMessages.push({
        id: "2",
        type: "bill_card",
        status: group.status === "settled" ? "paid" : "unpaid", // Simplification
        amount: totalAmount,
        group,
        expenses
    });

    // If I just paid (detected by success param or simply refetch status)
    // Could check if my expense is paid
    if (role === "ower" && myExpense?.status === "paid") {
         initialMessages.push({
            id: "payment_confirm",
            type: "system",
            text: `You paid your share of ₹${myAmount}` 
         });
    }

    setMessages(initialMessages);

    // Socket Integration
    const socket = io(API_URL.replace("/api/v1", ""), {
        transports: ["websocket"], // Force websocket
    });

    socket.on("connect", () => {
        console.log("Connected to socket");
        socket.emit("join_group", groupId);
    });

    socket.on("payment:received", (data: any) => {
        // Validation: Ensure event is for this group
        if (data.groupId !== groupId) return;
        
        // Show system message
        addMessage({
            id: Date.now().toString(),
            type: "system",
            text: `${data.payerName} paid ₹${data.amount}`
        });

        // Refetch data to update bill card and expense list
        refetch();
    });

    socket.on("group:settled", (data: any) => {
        if (data.groupId !== groupId) return;
        
        addMessage({
            id: Date.now().toString(),
            type: "system",
            text: `All expenses settled! Group is now closed.`
        });
        refetch();
    });

    return () => {
        socket.disconnect();
    };
  }, [group, expenses, role, groupId, refetch]); // eslint-disable-next-line react-hooks/exhaustive-deps

  const addMessage = (msg: any) => {
    setMessages(prev => [...prev, msg]);
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
  };
 
  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    addMessage({
        id: Date.now().toString(),
        type: "text",
        sender: "You",
        text: inputText,
        isMe: true
    });
    setInputText("");
  };

  const handlePayBill = () => {
    // If Ower: Pay Share. Payer doesn't pay themselves here (they initiated).
    if (role !== "ower") return;
    
    // Navigate to UPI PIN
    router.push({
        pathname: "/(protected)/upi-pin",
        params: {
            amount: myAmount.toString(),
            payeeName: group?.creator?.name || "Group Admin",
            vpa: "", // backend knows
            returnTo: "/(protected)/split-group-chat", // Tell UPI screen to come back here
            transactionType: "split_bill",
            groupId: groupId
        }
    } as any);
  };

  const renderMessage = (msg: any) => {
      // ... (system message logic)
      if (msg.type === "system") {
        return (
            <View style={styles.systemMessage}>
                <Text style={styles.systemText}>{msg.text}</Text>
            </View>
        );
      }

      if (msg.type === "bill_card") {
          const isSettled = msg.group.status === "settled";
          return (
              <View style={styles.billCardContainer}>
                    {/* ... (Header logic same) */}
                    <LinearGradient
                        colors={isSettled ? ["rgba(61, 220, 151, 0.1)", "rgba(61, 220, 151, 0.05)"] : ["rgba(255, 140, 50, 0.1)", "rgba(255, 140, 50, 0.05)"]}
                        style={styles.billCard}
                    >
                    <View style={styles.billHeader}>
                        <View style={[styles.iconBox, isSettled ? { backgroundColor: "rgba(61, 220, 151, 0.2)" } : {}]}>
                            <MaterialIcons 
                                name={isSettled ? "check-circle" : "receipt-long"} 
                                size={24} 
                                color={isSettled ? "#3DDC97" : "#FF8C32"} 
                            />
                        </View>
                        <View>
                            <Text style={styles.billTitle}>Bill Split: {msg.group.name}</Text>
                            <Text style={styles.billSubtitle}>{isSettled ? "Settled successfully" : "Pending Settlement"}</Text>
                        </View>
                    </View>

                     <View style={styles.billDetails}>
                        <View style={styles.billRow}>
                            <Text style={styles.billLabel}>Total Amount</Text>
                            <Text style={styles.billValue}>₹{msg.amount}</Text>
                        </View>
                        
                        <View style={{ height: 1, backgroundColor: "rgba(255,255,255,0.1)", marginVertical: 12 }} />

                        <Text style={[styles.billLabel, { marginBottom: 8 }]}>Participants</Text>
                        
                        {/* Payer (Creator) */}
                        <View style={styles.participantRow}>
                             <View style={styles.participantInfo}>
                                <View style={styles.participantAvatar}>
                                    <Text style={styles.avatarText}>{msg.group.creator?.name?.[0]}</Text>
                                </View>
                                <Text style={styles.participantName}>
                                    {msg.group.creator?.name} (Paid Total)
                                </Text>
                             </View>
                             <MaterialIcons name="check-circle" size={16} color="#3DDC97" />
                        </View>

                        {/* Expenses (Owers) */}
                        {msg.expenses?.map((exp: any, idx: number) => {
                             const isMe = exp.ower?._id === user?.id; 
                             const paid = exp.status === "paid";
                             return (
                                <View key={idx} style={styles.participantRow}>
                                    <View style={styles.participantInfo}>
                                        <View style={[styles.participantAvatar, { backgroundColor: "#1A1A22" }]}>
                                            <Text style={styles.avatarText}>{exp.ower?.name?.[0]}</Text>
                                        </View>
                                        <Text style={styles.participantName}>
                                            {exp.ower?.name} {isMe ? "(You)" : ""}
                                        </Text>
                                    </View>
                                    {paid ? (
                                        <MaterialIcons name="check-circle" size={16} color="#3DDC97" />
                                    ) : (
                                        <View style={styles.pendingBadge}>
                                             <MaterialIcons name="access-time" size={12} color="#FF8C32" />
                                             <Text style={styles.pendingText}>₹{exp.amount}</Text>
                                        </View>
                                    )}
                                </View>
                             );
                        })}
                    </View>

                    {/* Show Pay Button only if I am Ower and UNPAID */}
                    {role === "ower" && myExpense && myExpense.status === "pending" && (
                        <TouchableOpacity style={styles.payButton} onPress={handlePayBill}>
                            <Text style={styles.payButtonText}>
                                Pay Your Share ₹{myAmount}
                            </Text>
                        </TouchableOpacity>
                    )}
                </LinearGradient>
              </View>
          );
      }
      
      // ... text messages logic
      const isMe = msg.isMe;
      // ... render text message UI
      return (
        <View style={[styles.messageRow, isMe ? styles.messageRowMe : styles.messageRowFriend]}>
            {!isMe && <View style={styles.messageAvatar}><Text style={styles.avatarText}>{msg.sender[0]}</Text></View>}
            <View style={[styles.messageBubble, isMe ? styles.bubbleMe : styles.bubbleFriend]}>
                {!isMe && <Text style={styles.senderName}>{msg.sender}</Text>}
                <Text style={styles.messageText}>{msg.text}</Text>
            </View>
        </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.push("/(protected)/(tabs)")}>
            <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View>
             <Text style={styles.headerTitle}>{payeeName} Split Group</Text>
             <Text style={styles.headerSubtitle}>{group?.members?.length ? group.members.length + 1 : "?"} Members</Text>
        </View>
        <TouchableOpacity style={styles.backButton}>
             <MaterialIcons name="info-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Chat Area */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.chatArea} 
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} tintColor="#FF8C32" />}
      >
        {messages.map((msg, index) => (
            <View key={index}>{renderMessage(msg)}</View> // Key should be better but index fine for now
        ))}
      </ScrollView>

      {/* Input Area */}
      <KeyboardAvoidingWrapper offset={Platform.OS === "ios" ? insets.bottom : 0}>
         <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 10 }]}>
            <TextInput
                style={styles.input}
                placeholder="Type a message..."
                placeholderTextColor="#6B6B7B"
                value={inputText}
                onChangeText={setInputText}
            />
            <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
                <MaterialIcons name="send" size={20} color="#FFFFFF" />
            </TouchableOpacity>
         </View>
      </KeyboardAvoidingWrapper>
    </View>
  );
}

// Helper to avoid duplicate KeyboardAvoidingView imports/logic
import { KeyboardAvoidingView, Platform } from "react-native";
const KeyboardAvoidingWrapper = ({ children, offset }: any) => {
    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"} 
            keyboardVerticalOffset={offset + 60}
        >
            {children}
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0F14",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  headerSubtitle: {
      color: "#B0B0C3",
      fontSize: 12,
  },
  chatArea: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  systemMessage: {
    alignSelf: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 20,
  },
  systemText: {
    color: "#B0B0C3",
    fontSize: 12,
  },
  billCardContainer: {
      marginBottom: 24,
  },
  billCard: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.1)",
      padding: 16,
  },
  billHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 16,
  },
  iconBox: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "rgba(255, 140, 50, 0.1)",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
  },
  billTitle: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "700",
  },
  billSubtitle: {
      color: "#B0B0C3",
      fontSize: 12,
  },
  billDetails: {
      backgroundColor: "rgba(0,0,0,0.2)",
      borderRadius: 12,
      padding: 12,
      marginBottom: 16,
  },
  billRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 8,
  },
  billLabel: {
      color: "#B0B0C3",
      fontSize: 14,
  },
  billValue: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "600",
  },
  payButton: {
      backgroundColor: "#FF8C32",
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: "center",
  },
  payButtonText: {
      color: "#FFFFFF",
      fontWeight: "700",
      fontSize: 16,
  },
  paidStatus: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6
  },
  paidText: {
      color: "#3DDC97",
      fontSize: 14,
      fontWeight: "500",
  },
  messageRow: {
      flexDirection: "row",
      marginBottom: 16,
      maxWidth: "80%",
  },
  messageRowMe: {
      alignSelf: "flex-end",
      flexDirection: "row-reverse",
  },
  messageRowFriend: {
      alignSelf: "flex-start",
  },
  messageBubble: {
      padding: 12,
      borderRadius: 16,
  },
  bubbleMe: {
      backgroundColor: "#2962FF",
      borderBottomRightRadius: 2,
  },
  bubbleFriend: {
      backgroundColor: "#1A1A22",
      borderBottomLeftRadius: 2,
      marginLeft: 8,
  },
  messageText: {
      color: "#FFFFFF",
      fontSize: 14,
  },
  messageAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: "#FF8C32",
      alignItems: "center",
      justifyContent: "center",
  },
  avatarText: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "700",
  },
  senderName: {
      color: "#FF8C32",
      fontSize: 10,
      marginBottom: 2,
      fontWeight: "700"
  },
  inputContainer: {
      flexDirection: "row",
      paddingHorizontal: 16,
      paddingTop: 10,
      backgroundColor: "#0F0F14",
      borderTopWidth: 1,
      borderTopColor: "rgba(255,255,255,0.05)",
  },
  input: {
      flex: 1,
      backgroundColor: "#1A1A22",
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 10,
      color: "#FFFFFF",
      fontSize: 14,
      marginRight: 10,
  },
  sendButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: "#FF8C32",
      alignItems: "center",
      justifyContent: "center",
  },
  participantRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 8,
  },
  participantInfo: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
  },
  participantAvatar: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: "#FF8C32",
      alignItems: "center",
      justifyContent: "center",
  },
  participantName: {
      fontSize: 14,
      color: "#FFFFFF",
  },
  pendingBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: "rgba(255,140,50,0.1)",
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
  },
  pendingText: {
      fontSize: 12,
      color: "#FF8C32",
      fontWeight: "600",
  },
});
