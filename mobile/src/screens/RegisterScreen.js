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
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { StatusBar } from 'expo-status-bar';

const RegisterScreen = ({ navigation }) => {
    const theme = useTheme();
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();

    const handleRegister = async () => {
        if (!username || !email || !password || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        const emailRegex = /^\S+@\S+\.\S+$/;
        if (!emailRegex.test(email)) {
            Alert.alert('Error', 'Please enter a valid email address');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            const result = await register(username, password, email);
            if (result.success) {
                Alert.alert('Success', 'Account created successfully! Please login.', [
                    { text: 'OK', onPress: () => navigation.navigate('Login') }
                ]);
            } else {
                Alert.alert('Registration Failed', result.error || 'Something went wrong');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { backgroundColor: theme.colors.background }]}
        >
            <StatusBar style={theme.dark ? "light" : "dark"} />
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <View style={[styles.logoContainer, { backgroundColor: theme.colors.primary }]}>
                        <Text style={styles.logoText}>FRAS</Text>
                    </View>
                    <Text style={[styles.title, { color: theme.colors.text }]}>Create Account</Text>
                    <Text style={[styles.subtitle, { color: theme.colors.subtext }]}>Join the Fleet Reporting System</Text>
                </View>

                <View style={[styles.form, { backgroundColor: theme.colors.card }]}>
                    <View style={styles.inputContainer}>
                        <Text style={[styles.label, { color: theme.colors.subtext }]}>Username</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.colors.input, color: theme.colors.text, borderColor: theme.colors.border }]}
                            placeholder="Pick a unique username"
                            placeholderTextColor={theme.colors.subtext}
                            value={username}
                            onChangeText={setUsername}
                            autoCapitalize="none"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={[styles.label, { color: theme.colors.subtext }]}>Email Address</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.colors.input, color: theme.colors.text, borderColor: theme.colors.border }]}
                            placeholder="name@example.com"
                            placeholderTextColor={theme.colors.subtext}
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={[styles.label, { color: theme.colors.subtext }]}>Password</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.colors.input, color: theme.colors.text, borderColor: theme.colors.border }]}
                            placeholder="Minimum 6 characters"
                            placeholderTextColor={theme.colors.subtext}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                        {password.length > 0 && (
                            <View style={{ marginTop: 8 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <Text style={{ fontSize: 10, color: theme.colors.subtext }}>Strength</Text>
                                    <Text style={{
                                        fontSize: 10, fontWeight: 'bold', color:
                                            password.length < 6 ? '#ef4444' :
                                                password.length < 10 ? '#f59e0b' : '#10b981'
                                    }}>
                                        {password.length < 6 ? 'Weak' : password.length < 10 ? 'Fair' : 'Strong'}
                                    </Text>
                                </View>
                                <View style={{ height: 4, width: '100%', backgroundColor: theme.colors.border, borderRadius: 2, overflow: 'hidden' }}>
                                    <View style={{
                                        height: '100%',
                                        width: `${Math.min(100, (password.length / 12) * 100)}%`,
                                        backgroundColor: password.length < 6 ? '#ef4444' : password.length < 10 ? '#f59e0b' : '#10b981'
                                    }} />
                                </View>
                            </View>
                        )}
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={[styles.label, { color: theme.colors.subtext }]}>Confirm Password</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.colors.input, color: theme.colors.text, borderColor: theme.colors.border }]}
                            placeholder="Repeat your password"
                            placeholderTextColor={theme.colors.subtext}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.registerButton, { backgroundColor: theme.colors.primary }]}
                        onPress={handleRegister}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.registerButtonText}>Create Account</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                        <Text style={[styles.footerText, { color: theme.colors.subtext }]}>
                            Already have an account? <Text style={{ color: theme.colors.primary, fontWeight: 'bold' }}>Sign In</Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 24,
        justifyContent: 'center',
        paddingTop: 60,
        paddingBottom: 40,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    logoContainer: {
        width: 80,
        height: 80,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
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
    registerButton: {
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 12,
        elevation: 4,
    },
    registerButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    footer: {
        marginTop: 32,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 14,
    },
});

export default RegisterScreen;
