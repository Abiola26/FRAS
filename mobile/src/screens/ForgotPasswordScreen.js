import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { authAPI } from '../services/api';

const ForgotPasswordScreen = ({ navigation }) => {
    const theme = useTheme();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: Request, 2: Reset
    const [token, setToken] = useState('');
    const [newPassword, setNewPassword] = useState('');

    const handleRequestReset = async () => {
        if (!email) {
            Alert.alert('Error', 'Please enter your email address');
            return;
        }

        setLoading(true);
        try {
            const response = await authAPI.requestPasswordReset(email);
            setLoading(false);
            Alert.alert(
                'Token Generated',
                `For development: Your reset token is: \n\n${response.token}\n\nIn production, this would be sent to your email.`,
                [{ text: 'Next Step', onPress: () => setStep(2) }]
            );
        } catch (error) {
            setLoading(false);
            Alert.alert('Error', error.response?.data?.detail || 'Failed to request password reset');
        }
    };

    const handleConfirmReset = async () => {
        if (!token || !newPassword) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            await authAPI.confirmPasswordReset(token, newPassword);
            setLoading(false);
            Alert.alert('Success', 'Your password has been reset successfully.', [
                { text: 'Login', onPress: () => navigation.navigate('Login') }
            ]);
        } catch (error) {
            setLoading(false);
            Alert.alert('Error', error.response?.data?.detail || 'Failed to reset password');
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { backgroundColor: theme.colors.background }]}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => step === 2 ? setStep(1) : navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>

                <View style={styles.header}>
                    <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '20' }]}>
                        <Ionicons name="lock-open-outline" size={40} color={theme.colors.primary} />
                    </View>
                    <Text style={[styles.title, { color: theme.colors.text }]}>
                        {step === 1 ? 'Forgot Password?' : 'Reset Password'}
                    </Text>
                    <Text style={[styles.subtitle, { color: theme.colors.subtext }]}>
                        {step === 1
                            ? "No worries! Enter your email and we'll send you a reset token."
                            : "Enter the token you received and your new password."}
                    </Text>
                </View>

                {step === 1 ? (
                    <View style={styles.form}>
                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: theme.colors.subtext }]}>Email Address</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: theme.colors.input, color: theme.colors.text, borderColor: theme.colors.border }]}
                                placeholder="name@example.com"
                                placeholderTextColor={theme.colors.subtext}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.button, { backgroundColor: theme.colors.primary }]}
                            onPress={handleRequestReset}
                            disabled={loading}
                        >
                            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Send Reset Link</Text>}
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.form}>
                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: theme.colors.subtext }]}>Reset Token</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: theme.colors.input, color: theme.colors.text, borderColor: theme.colors.border }]}
                                placeholder="Paste token here"
                                placeholderTextColor={theme.colors.subtext}
                                value={token}
                                onChangeText={setToken}
                                autoCapitalize="none"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: theme.colors.subtext }]}>New Password</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: theme.colors.input, color: theme.colors.text, borderColor: theme.colors.border }]}
                                placeholder="Minimum 6 characters"
                                placeholderTextColor={theme.colors.subtext}
                                value={newPassword}
                                onChangeText={setNewPassword}
                                secureTextEntry
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.button, { backgroundColor: theme.colors.primary }]}
                            onPress={handleConfirmReset}
                            disabled={loading}
                        >
                            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Reset Password</Text>}
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        padding: 24,
    },
    backButton: {
        marginTop: 40,
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginTop: 40,
        marginBottom: 48,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 12,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: 20,
    },
    form: {
        width: '100%',
    },
    inputContainer: {
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    input: {
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 12,
        fontSize: 16,
        borderWidth: 1,
    },
    button: {
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 12,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default ForgotPasswordScreen;
