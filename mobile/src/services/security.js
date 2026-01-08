import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';

const BIO_KEY = 'fras_biometric_credentials';

export const securityService = {
    /**
     * Check if hardware supports biometrics and has enrolled users
     */
    async isBiometricAvailable() {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        return hasHardware && isEnrolled;
    },

    /**
     * Authenticate user via biometrics
     */
    async authenticate() {
        const result = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Authenticate to sign in',
            fallbackLabel: 'Use Passcode',
        });
        return result.success;
    },

    /**
     * Securely save credentials
     */
    async saveCredentials(username, password) {
        const credentials = JSON.stringify({ username, password });
        await SecureStore.setItemAsync(BIO_KEY, credentials);
    },

    /**
     * Retrieve stored credentials
     */
    async getCredentials() {
        const credentials = await SecureStore.getItemAsync(BIO_KEY);
        return credentials ? JSON.parse(credentials) : null;
    },

    /**
     * Delete stored credentials
     */
    async deleteCredentials() {
        await SecureStore.deleteItemAsync(BIO_KEY);
    }
};
