import { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Image as RNImage } from "react-native";
import { useRouter } from "expo-router";
import * as Contacts from "expo-contacts";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useCustomAlert } from "../../contexts/CustomAlertContext";

export default function PayContactsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showAlert } = useCustomAlert();
  
  const [contacts, setContacts] = useState<Contacts.Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contacts.Contact[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState<Contacts.PermissionStatus | null>(null);

  const requestPermission = async () => {
    setLoading(true);
    const { status } = await Contacts.requestPermissionsAsync();
    setPermissionStatus(status);
    if (status === "granted") {
      loadContacts();
    } else {
       // If manually triggering, ensure we stop loading
       setLoading(false);
    }
  };

  const loadContacts = async () => {
    const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Image],
        sort: Contacts.SortTypes.FirstName,
    });

    const validContacts = data.filter(c => c.phoneNumbers && c.phoneNumbers.length > 0);
    setContacts(validContacts);
    setFilteredContacts(validContacts);
    setLoading(false);
  };

  useEffect(() => {
    requestPermission();
  }, []);

  const handleSearch = (text: string) => {
    setSearch(text);
    if (text) {
      const newData = contacts.filter((item) => {
        const itemData = item.name ? item.name.toUpperCase() : "".toUpperCase();
        const textData = text.toUpperCase();
        const phoneMatch = item.phoneNumbers?.some(p => 
            p.number?.replace(/\D/g, "").includes(textData.replace(/\D/g, "")) || 
            p.number?.includes(textData)
        );
        return itemData.indexOf(textData) > -1 || phoneMatch;
      });
      setFilteredContacts(newData);
    } else {
      setFilteredContacts(contacts);
    }
  };

  const handleSelectContact = (contact: Contacts.Contact) => {
    if (!contact.phoneNumbers || contact.phoneNumbers.length === 0) return;
    
    const phoneNumber = contact.phoneNumbers[0].number?.replace(/\D/g, ""); // Clean content
    const vpa = `${phoneNumber}@upi`; // Simulated VPA
    
    router.push({
        pathname: "/(protected)/payment-details",
        params: {
            payeeName: contact.name,
            vpa: vpa
        }
    } as any);
  };

  const renderItem = ({ item }: { item: Contacts.Contact }) => {
    const hasImage = item.imageAvailable && item.image?.uri;
    
    return (
      <TouchableOpacity style={styles.contactItem} onPress={() => handleSelectContact(item)}>
        <View style={styles.avatarContainer}>
            {hasImage ? (
                <RNImage source={{ uri: item.image?.uri }} style={styles.avatar} />
            ) : (
                <View style={[styles.avatar, styles.placeholderAvatar]}>
                    <Text style={styles.avatarText}>
                        {item.name ? item.name[0].toUpperCase() : "?"}
                    </Text>
                </View>
            )}
        </View>
        <View style={styles.contactInfo}>
            <Text style={styles.contactName}>{item.name}</Text>
            <Text style={styles.contactPhone}>
                {item.phoneNumbers && item.phoneNumbers[0] ? item.phoneNumbers[0].number : "No number"}
            </Text>
        </View>
        <MaterialIcons name="chevron-right" size={24} color="#5E5E7D" />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#FF8C32" />
      </View>
    );
  }

  if (permissionStatus !== "granted") {
     return (
        <View style={[styles.container, styles.center, { padding: 40 }]}>
            <MaterialIcons name="contacts" size={64} color="#FF8C32" />
            <Text style={[styles.headerTitle, { marginTop: 20, textAlign: 'center' }]}>Permission Required</Text>
            <Text style={{ color: "#B0B0C3", textAlign: 'center', marginTop: 10, marginBottom: 30 }}>
                We need access to your contacts to help you pay friends easily.
            </Text>
            
            <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
                <Text style={styles.permissionButtonText}>Allow Access</Text>
            </TouchableOpacity>

            <TouchableOpacity style={{ marginTop: 20 }} onPress={() => router.back()}>
                <Text style={{ color: "#5E5E7D" }}>Go Back</Text>
            </TouchableOpacity>
        </View>
     );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
          colors={["rgba(26,26,34,1)", "rgba(26,26,34,0.8)"]}
          style={[styles.header, { paddingTop: insets.top + 12 }]}
        >
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back-ios" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Pay Contacts</Text>
          <View style={{ width: 40 }} />
      </LinearGradient>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
            <MaterialIcons name="search" size={20} color="#5E5E7D" />
            <TextInput
                style={styles.searchInput}
                placeholder="Search name or number"
                placeholderTextColor="#5E5E7D"
                value={search}
                onChangeText={handleSearch}
            />
        </View>
      </View>

      {/* List */}
      <FlatList
        data={filteredContacts}
        keyExtractor={(item: any) => item.id || Math.random().toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No contacts found</Text>
            </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0F14",
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A22",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    color: "#FFFFFF",
    fontSize: 16,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  placeholderAvatar: {
    backgroundColor: "#2A2A35",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#FF8C32",
    fontSize: 20,
    fontWeight: "700",
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  contactPhone: {
    color: "#B0B0C3",
    fontSize: 14,
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    color: "#5E5E7D",
    fontSize: 16,
  },
  permissionButton: {
    backgroundColor: "#FF8C32",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
