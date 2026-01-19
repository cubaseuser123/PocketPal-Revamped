import React from "react";
import { View, Text, StyleSheet, Modal, TouchableOpacity, Share } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
// @ts-ignore
import * as Clipboard from 'expo-clipboard';

interface TransactionDetailsModalProps {
    visible: boolean;
    onClose: () => void;
    transaction: any;
}

export function TransactionDetailsModal({ visible, onClose, transaction }: TransactionDetailsModalProps) {
    if (!transaction) return null;

    const isExpense = transaction.type === "expense";
    const date = new Date(transaction.createdAt).toLocaleString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
    });

    const handleCopyId = async () => {
        await Clipboard.setStringAsync(transaction._id);
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Transaction Details:\nType: ${transaction.type}\nAmount: ₹${Math.abs(transaction.amount)}\nTo/From: ${transaction.name}\nDate: ${date}\nID: ${transaction._id}`,
            });
        } catch (error) {
            console.log(error);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
                
                <View style={styles.container}>
                    <View style={styles.handle} />
                    
                    <View style={styles.header}>
                        <Text style={styles.title}>Transaction Details</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                             <MaterialIcons name="close" size={24} color="#B0B0C3" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.amountContainer}>
                        <View style={[styles.iconBox, { backgroundColor: isExpense ? "rgba(255, 140, 50, 0.1)" : "rgba(61, 220, 151, 0.1)" }]}>
                             <Text style={{ fontSize: 32 }}>{transaction.emoji || (isExpense ? "💸" : "💰")}</Text>
                        </View>
                        <Text style={[styles.amount, { color: isExpense ? "#FFFFFF" : "#3DDC97" }]}>
                            {isExpense ? "-" : "+"}₹{Math.abs(transaction.amount)}
                        </Text>
                        <Text style={styles.status}>Success</Text>
                    </View>

                    <View style={styles.detailsBox}>
                         <View style={styles.row}>
                            <Text style={styles.label}>To/From</Text>
                            <Text style={styles.value}>{transaction.name}</Text>
                         </View>
                         <View style={styles.divider} />
                         
                         <View style={styles.row}>
                            <Text style={styles.label}>Date</Text>
                            <Text style={styles.value}>{date}</Text>
                         </View>
                         <View style={styles.divider} />

                         <View style={styles.row}>
                            <Text style={styles.label}>Type</Text>
                            <Text style={[styles.value, { textTransform: "capitalize", color: "#FFFFFF" }]}>{transaction.type}</Text>
                         </View>
                         <View style={styles.divider} />

                         {transaction.note && (
                             <>
                                <View style={styles.row}>
                                    <Text style={styles.label}>Note</Text>
                                    <Text style={styles.value}>{transaction.note}</Text>
                                </View>
                                <View style={styles.divider} />
                             </>
                         )}

                         <View style={styles.row}>
                            <Text style={styles.label}>Transaction ID</Text>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                <Text style={[styles.value, { fontSize: 12, color: "#757575" }]}>
                                    {transaction._id.slice(0, 12)}...
                                </Text>
                                <TouchableOpacity onPress={handleCopyId}>
                                    <MaterialIcons name="content-copy" size={16} color="#B0B0C3" />
                                </TouchableOpacity>
                            </View>
                         </View>
                    </View>

                    <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
                        <MaterialIcons name="share" size={20} color="#FFFFFF" />
                        <Text style={styles.shareText}>Share Receipt</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: "flex-end",
        backgroundColor: "rgba(0,0,0,0.6)",
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    container: {
        backgroundColor: "#1A1A22",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
        minHeight: 500,
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: "rgba(255,255,255,0.1)",
        borderRadius: 2,
        alignSelf: "center",
        marginBottom: 20,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 30,
    },
    title: {
        fontSize: 20,
        fontWeight: "700",
        color: "#FFFFFF",
    },
    closeBtn: {
        padding: 4,
    },
    amountContainer: {
        alignItems: "center",
        marginBottom: 32,
    },
    iconBox: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
    },
    amount: {
        fontSize: 36,
        fontWeight: "700",
        marginBottom: 4,
    },
    status: {
        fontSize: 14,
        color: "#3DDC97",
        fontWeight: "600",
        backgroundColor: "rgba(61, 220, 151, 0.1)",
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    detailsBox: {
        backgroundColor: "#22222B",
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 4,
    },
    label: {
        fontSize: 14,
        color: "#757575",
    },
    value: {
        fontSize: 14,
        color: "#FFFFFF",
        fontWeight: "500",
        maxWidth: "60%",
        textAlign: "right",
    },
    divider: {
        height: 1,
        backgroundColor: "rgba(255,255,255,0.05)",
        marginVertical: 12,
    },
    shareBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FF8C32",
        paddingVertical: 16,
        borderRadius: 16,
        gap: 8,
    },
    shareText: {
        color: "#FFFFFF",
        fontWeight: "700",
        fontSize: 16,
    },
});
