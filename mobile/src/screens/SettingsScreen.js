import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Switch,
    Alert,
    ActivityIndicator,
    Modal,
    TextInput,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { analyticsAPI, authAPI } from '../services/api';

const SettingItem = ({ icon, title, subtitle, onPress, toggle, value, color = "#2563eb", loading = false, theme }) => (
    <TouchableOpacity
        style={[styles.item, { backgroundColor: theme.colors.card }]}
        onPress={onPress}
        disabled={toggle !== undefined || loading}
    >
        <View style={[styles.iconBox, { backgroundColor: `${color}15` }]}>
            {loading ? <ActivityIndicator size="small" color={color} /> : <Ionicons name={icon} size={22} color={color} />}
        </View>
        <View style={styles.itemContent}>
            <Text style={[styles.itemTitle, { color: theme.colors.text }]}>{title}</Text>
            {subtitle && <Text style={[styles.itemSubtitle, { color: theme.colors.subtext }]}>{subtitle}</Text>}
        </View>
        {toggle !== undefined ? (
            <Switch
                trackColor={{ false: "#e2e8f0", true: "#93c5fd" }}
                thumbColor={value ? "#2563eb" : "#f1f5f9"}
                onValueChange={toggle}
                value={value}
            />
        ) : (
            <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
        )}
    </TouchableOpacity>
);

const SettingsScreen = ({ navigation }) => {
    const { user, logout, updateUser, isBiometricEnabled, toggleBiometrics } = useAuth();
    const theme = useTheme();
    const [notifications, setNotifications] = useState(true);
    const [isExporting, setIsExporting] = useState(false);

    // Modals visibility
    const [isPasswordModalVisible, setPasswordModalVisible] = useState(false);
    const [isProfileModalVisible, setProfileModalVisible] = useState(false);
    const [isBioVerifyModalVisible, setBioVerifyModalVisible] = useState(false);

    // Password change state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [bioPassword, setBioPassword] = useState('');
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    // Profile state
    const [editUsername, setEditUsername] = useState(user?.username || '');
    const [editEmail, setEditEmail] = useState(user?.email || '');
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

    const handleUpdateProfile = async () => {
        if (!editUsername) {
            Alert.alert('Error', 'Username cannot be empty');
            return;
        }
        try {
            setIsUpdatingProfile(true);
            const updatedUser = await authAPI.updateProfile({
                username: editUsername,
                email: editEmail
            });
            updateUser(updatedUser);
            Alert.alert('Success', 'Profile updated successfully');
            setProfileModalVisible(false);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', error.response?.data?.detail || 'Failed to update profile');
        } finally {
            setIsUpdatingProfile(false);
        }
    };

    const handleLogout = () => {
        Alert.alert(
            "Logout",
            "Are you sure you want to sign out?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Logout", style: "destructive", onPress: logout }
            ]
        );
    };

    const handleBiometricToggle = async (value) => {
        if (value) {
            if (Platform.OS === 'ios') {
                Alert.prompt(
                    'Verify Password',
                    'Enter your password to enable biometric login.',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        {
                            text: 'Enable',
                            onPress: async (password) => {
                                if (password) await confirmBiometricEnable(password);
                            }
                        }
                    ],
                    'secure-text'
                );
            } else {
                setBioPassword('');
                setBioVerifyModalVisible(true);
            }
        } else {
            await toggleBiometrics(false);
        }
    };

    const confirmBiometricEnable = async (password) => {
        if (!password) {
            Alert.alert('Error', 'Password is required');
            return;
        }
        const result = await toggleBiometrics(true, user.username, password);
        if (!result.success) {
            Alert.alert('Error', result.error);
        } else {
            Alert.alert('Success', 'Biometric login enabled');
            setBioVerifyModalVisible(false);
        }
    };

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }
        if (newPassword.length < 6) {
            Alert.alert('Error', 'New password must be at least 6 characters');
            return;
        }

        try {
            setIsChangingPassword(true);
            await authAPI.changePassword(currentPassword, newPassword);
            Alert.alert('Success', 'Password updated successfully');
            setPasswordModalVisible(false);
            setCurrentPassword('');
            setNewPassword('');
        } catch (error) {
            console.error(error);
            Alert.alert('Error', error.response?.data?.detail || 'Failed to update password');
        } finally {
            setIsChangingPassword(false);
        }
    };

    const generatePDFReport = async () => {
        try {
            setIsExporting(true);
            const data = await analyticsAPI.getChartData();

            const htmlContent = `
        <html>
          <head>
            <style>
              body { font-family: 'Helvetica'; padding: 20px; }
              h1 { color: #2563eb; text-align: center; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #e2e8f0; padding: 12px; text-align: left; }
              th { background-color: #f8fafc; color: #64748b; }
              .total { font-weight: bold; color: #2563eb; }
            </style>
          </head>
          <body>
            <h1>FRAS Fleet Performance Report</h1>
            <p>Generated on: ${new Date().toLocaleString()}</p>
            <p>User: ${user?.username || 'Admin'}</p>
            
            <h3>Top Performing Fleets</h3>
            <table>
              <tr>
                <th>Fleet Code</th>
                <th>Revenue</th>
              </tr>
              ${data.raw?.top_fleets?.map(f => `
                <tr>
                  <td>${f.label}</td>
                  <td>₦${f.value.toLocaleString()}</td>
                </tr>
              `).join('')}
            </table>
            
            <p style="margin-top: 40px; text-align: center; color: #94a3b8; font-size: 12px;">
              Fleet Reporting & Analytics System (FRAS) Mobile
            </p>
          </body>
        </html>
      `;

            const { uri } = await Print.printToFileAsync({ html: htmlContent });
            await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to generate PDF report');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
                <View style={[styles.userSection, { backgroundColor: theme.colors.card }]}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {user?.username?.charAt(0).toUpperCase() || 'U'}
                        </Text>
                    </View>
                    <Text style={[styles.userName, { color: theme.colors.text }]}>{user?.username || 'User'}</Text>
                    <Text style={[styles.userRole, { color: theme.colors.subtext, fontSize: 12 }]}>
                        {user?.role?.toUpperCase()} • {user?.account_id || (user?.id ? `#${user.id}` : 'N/A')}
                    </Text>
                    <TouchableOpacity
                        style={[styles.editBtn, { borderColor: theme.colors.border }]}
                        onPress={() => setProfileModalVisible(true)}
                    >
                        <Text style={[styles.editBtnText, { color: theme.colors.text }]}>View Profile</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.subtext }]}>Application</Text>
                    <SettingItem
                        icon="notifications-outline"
                        title="Push Notifications"
                        subtitle="Alerts for unusual fleet trends"
                        toggle={setNotifications}
                        value={notifications}
                        theme={theme}
                    />
                    <SettingItem
                        icon="moon-outline"
                        title="Dark Mode"
                        subtitle="Toggle app theme"
                        toggle={theme.toggleTheme}
                        value={theme.dark}
                        color="#8b5cf6"
                        theme={theme}
                    />
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.subtext }]}>Security</Text>
                    <SettingItem
                        icon="finger-print-outline"
                        title="Biometric Login"
                        subtitle="Use FaceID or Fingerprint"
                        toggle={handleBiometricToggle}
                        value={isBiometricEnabled}
                        color="#10b981"
                        theme={theme}
                    />
                    <SettingItem
                        icon="shield-checkmark-outline"
                        title="Two-Factor Auth"
                        subtitle="Add extra layer of security"
                        onPress={() => Alert.alert('Coming Soon', 'TFA is currently under development.')}
                        color="#ef4444"
                        theme={theme}
                    />
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.subtext }]}>Reports & Data</Text>
                    <SettingItem
                        icon="file-trait-outline"
                        title="Generate PDF Summary"
                        subtitle="Download top performance report"
                        onPress={generatePDFReport}
                        loading={isExporting}
                        color="#0ea5e9"
                        theme={theme}
                    />
                    <SettingItem
                        icon="list-outline"
                        title="Audit Logs"
                        subtitle="View system activity history"
                        onPress={() => navigation.navigate('AuditLogs')}
                        theme={theme}
                    />
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.subtext }]}>Security</Text>
                    <SettingItem
                        icon="shield-checkmark-outline"
                        title="Change Password"
                        subtitle="Update your security credentials"
                        onPress={() => setPasswordModalVisible(true)}
                        color="#10b981"
                        theme={theme}
                    />
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.subtext }]}>Account</Text>
                    <SettingItem
                        icon="log-out-outline"
                        title="Sign Out"
                        onPress={handleLogout}
                        color="#ef4444"
                        theme={theme}
                    />
                </View>

                <Text style={styles.versionText}>FRAS Mobile v1.2.0 • Stable</Text>
            </ScrollView>

            {/* Change Password Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={isPasswordModalVisible}
                onRequestClose={() => setPasswordModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.modalOverlay}
                >
                    <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Change Password</Text>
                            <TouchableOpacity onPress={() => setPasswordModalVisible(false)}>
                                <Ionicons name="close" size={24} color={theme.colors.subtext} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: theme.colors.subtext }]}>Current Password</Text>
                            <TextInput
                                style={[styles.modalInput, { backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }]}
                                placeholder="Enter current password"
                                placeholderTextColor={theme.colors.subtext}
                                secureTextEntry
                                value={currentPassword}
                                onChangeText={setCurrentPassword}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: theme.colors.subtext }]}>New Password</Text>
                            <TextInput
                                style={[styles.modalInput, { backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }]}
                                placeholder="Minimum 6 characters"
                                placeholderTextColor={theme.colors.subtext}
                                secureTextEntry
                                value={newPassword}
                                onChangeText={setNewPassword}
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.saveBtn, { opacity: isChangingPassword ? 0.7 : 1 }]}
                            onPress={handleChangePassword}
                            disabled={isChangingPassword}
                        >
                            {isChangingPassword ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.saveBtnText}>Update Password</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Profile Details Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={isProfileModalVisible}
                onRequestClose={() => setProfileModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>User Profile</Text>
                            <TouchableOpacity onPress={() => setProfileModalVisible(false)}>
                                <Ionicons name="close" size={24} color={theme.colors.subtext} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: theme.colors.subtext }]}>Username</Text>
                            <TextInput
                                style={[styles.modalInput, { backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }]}
                                value={editUsername}
                                onChangeText={setEditUsername}
                                placeholder="Edit your username"
                                placeholderTextColor={theme.colors.subtext}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: theme.colors.subtext }]}>Email Address</Text>
                            <TextInput
                                style={[styles.modalInput, { backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }]}
                                value={editEmail}
                                onChangeText={setEditEmail}
                                placeholder="Your email address"
                                placeholderTextColor={theme.colors.subtext}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>

                        <View style={styles.profileDetailRow}>
                            <Text style={[styles.detailLabel, { color: theme.colors.subtext }]}>Account Type</Text>
                            <View style={[styles.roleBadge, { backgroundColor: user?.role === 'admin' ? '#fee2e2' : '#eff6ff', borderColor: user?.role === 'admin' ? '#fecaca' : '#bfdbfe' }]}>
                                <Text style={[styles.roleBadgeText, { color: user?.role === 'admin' ? '#991b1b' : '#1e40af' }]}>{user?.role?.toUpperCase()}</Text>
                            </View>
                        </View>
                        <View style={styles.profileDetailRow}>
                            <Text style={[styles.detailLabel, { color: theme.colors.subtext }]}>Account ID</Text>
                            <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                                {user?.account_id || (user?.id ? `#${user.id}` : 'N/A')}
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={[styles.saveBtn, { opacity: isUpdatingProfile ? 0.7 : 1, marginTop: 24 }]}
                            onPress={handleUpdateProfile}
                            disabled={isUpdatingProfile}
                        >
                            {isUpdatingProfile ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.saveBtnText}>Save Profile</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Biometric Verification Modal */}
            <Modal
                visible={isBioVerifyModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setBioVerifyModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Enable Biometrics</Text>
                            <TouchableOpacity onPress={() => setBioVerifyModalVisible(false)}>
                                <Ionicons name="close" size={24} color={theme.colors.subtext} />
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.modalDescription, { color: theme.colors.subtext, marginBottom: 20 }]}>
                            For security, please verify your account password to enable biometric login.
                        </Text>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: theme.colors.subtext }]}>Your Password</Text>
                            <TextInput
                                style={[styles.modalInput, { backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }]}
                                value={bioPassword}
                                onChangeText={setBioPassword}
                                placeholder="Enter password"
                                placeholderTextColor={theme.colors.subtext}
                                secureTextEntry
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.saveBtn, { marginTop: 20 }]}
                            onPress={() => confirmBiometricEnable(bioPassword)}
                        >
                            <Text style={styles.saveBtnText}>Verify & Enable</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    userSection: {
        alignItems: 'center',
        padding: 32,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        marginBottom: 16,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#2563eb',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    avatarText: {
        color: '#fff',
        fontSize: 32,
        fontWeight: 'bold',
    },
    userName: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    userRole: {
        fontSize: 14,
        marginTop: 4,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    editBtn: {
        marginTop: 16,
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
    },
    editBtnText: {
        fontSize: 14,
        fontWeight: '500',
    },
    section: {
        marginTop: 16,
        paddingHorizontal: 16,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 12,
        marginLeft: 4,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        marginBottom: 8,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemContent: {
        flex: 1,
        marginLeft: 16,
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    itemSubtitle: {
        fontSize: 12,
        marginTop: 2,
    },
    versionText: {
        textAlign: 'center',
        marginTop: 40,
        marginBottom: 40,
        fontSize: 12,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        padding: 24,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        height: '60%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    modalDescription: {
        fontSize: 14,
        lineHeight: 20,
    },
    inputGroup: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 14,
        marginBottom: 8,
        fontWeight: '500',
    },
    modalInput: {
        height: 50,
        borderRadius: 12,
        paddingHorizontal: 16,
        borderWidth: 1,
        fontSize: 16,
    },
    saveBtn: {
        backgroundColor: '#2563eb',
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 12,
    },
    saveBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    profileDetailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    detailLabel: {
        fontSize: 14,
        fontWeight: '500',
    },
    detailValue: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    roleBadge: {
        backgroundColor: '#eff6ff',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#bfdbfe',
    },
    roleBadgeText: {
        fontSize: 12,
        color: '#1e40af',
        fontWeight: 'bold',
    },
});

export default SettingsScreen;
