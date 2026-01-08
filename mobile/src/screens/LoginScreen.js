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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { StatusBar } from 'expo-status-bar';

const LoginScreen = ({ navigation }) => {
    const theme = useTheme();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, isBiometricEnabled, loginWithBiometrics } = useAuth();

    const handleBiometricLogin = async () => {
        setLoading(true);
        const result = await loginWithBiometrics();
        if (!result.success) {
            setLoading(false);
            if (result.error !== 'Authentication failed') {
                Alert.alert('Error', result.error);
            }
        }
    };

    const handleLogin = async () => {
        if (!username || !password) {
            Alert.alert('Error', 'Please enter both username and password');
            return;
        }

        setLoading(true);
        const result = await login(username, password);

        if (!result.success) {
            setLoading(false);
            Alert.alert('Login Failed', result.error);
        }
        // If successful, the AuthContext state change will trigger navigation
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { backgroundColor: theme.colors.background }]}
        >
            <StatusBar style={theme.dark ? "light" : "dark"} />
            <View style={styles.inner}>
                <View style={styles.header}>
                    <View style={styles.logoContainer}>
                        <Text style={styles.logoText}>FRAS</Text>
                    </View>
                    <Text style={[styles.title, { color: theme.colors.text }]}>Welcome Back</Text>
                    <Text style={[styles.subtitle, { color: theme.colors.subtext }]}>Fleet Reporting & Analytics System</Text>
                </View>

                <View style={[styles.form, { backgroundColor: theme.colors.card }]}>
                    <View style={styles.inputContainer}>
                        <Text style={[styles.label, { color: theme.colors.subtext }]}>Username</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.colors.input, color: theme.colors.text, borderColor: theme.colors.border }]}
                            placeholder="Enter your username"
                            placeholderTextColor={theme.colors.subtext}
                            value={username}
                            onChangeText={setUsername}
                            autoCapitalize="none"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <Text style={[styles.label, { marginBottom: 0, color: theme.colors.subtext }]}>Password</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                                <Text style={{ color: theme.colors.primary, fontSize: 13, fontWeight: '600' }}>Forgot Password?</Text>
                            </TouchableOpacity>
                        </View>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.colors.input, color: theme.colors.text, borderColor: theme.colors.border }]}
                            placeholder="Enter your password"
                            placeholderTextColor={theme.colors.subtext}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.loginButton, { backgroundColor: theme.colors.primary }]}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.loginButtonText}>Sign In</Text>
                        )}
                    </TouchableOpacity>

                    {isBiometricEnabled && (
                        <TouchableOpacity
                            style={[styles.bioButton, { borderColor: theme.colors.primary }]}
                            onPress={handleBiometricLogin}
                            disabled={loading}
                        >
                            <Ionicons name="finger-print" size={24} color={theme.colors.primary} />
                            <Text style={[styles.bioButtonText, { color: theme.colors.primary }]}>Login with Biometrics</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.footer}>
                    <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                        <Text style={[styles.footerText, { color: theme.colors.subtext }]}>
                            Don't have an account? <Text style={{ color: theme.colors.primary, fontWeight: 'bold' }}>Sign Up</Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    inner: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 48,
    },
    logoContainer: {
        width: 80,
        height: 80,
        backgroundColor: '#2563eb',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        elevation: 8,
        shadowColor: '#2563eb',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    logoText: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
    },
    form: {
        padding: 24,
        borderRadius: 24,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    input: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        fontSize: 16,
        borderWidth: 1,
    },
    loginButton: {
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 12,
        elevation: 4,
        shadowColor: '#2563eb',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    loginButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    bioButton: {
        flexDirection: 'row',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
        borderWidth: 1.5,
        gap: 10,
    },
    bioButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    footer: {
        marginTop: 48,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 14,
    },
});

export default LoginScreen;
