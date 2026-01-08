import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { uploadAPI } from '../services/api';
import { useTheme } from '../context/ThemeContext';

const UploadScreen = () => {
    const theme = useTheme();
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: [
                    'text/comma-separated-values',
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'application/vnd.ms-excel',
                    'text/csv'
                ],
            });

            if (!result.canceled) {
                setFile(result.assets[0]);
            }
        } catch (err) {
            Alert.alert('Error', 'Failed to pick document');
        }
    };

    const handleUpload = async () => {
        if (!file) {
            Alert.alert('Selection Required', 'Please select a file first');
            return;
        }

        const formData = new FormData();
        formData.append('file', {
            uri: file.uri,
            name: file.name,
            type: file.mimeType || 'application/octet-stream',
        });

        try {
            setUploading(true);
            await uploadAPI.uploadFile(formData);
            Alert.alert('Success', 'File uploaded and processed successfully');
            setFile(null);
        } catch (err) {
            console.error(err);
            Alert.alert('Upload Failed', err.response?.data?.detail || 'Failed to upload file');
        } finally {
            setUploading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={styles.content}>
                <View style={[styles.header, { backgroundColor: theme.colors.card }]}>
                    <View style={[styles.iconContainer, { backgroundColor: `${theme.colors.primary}15` }]}>
                        <Ionicons name="cloud-upload" size={48} color={theme.colors.primary} />
                    </View>
                    <Text style={[styles.title, { color: theme.colors.text }]}>Upload Fleet Data</Text>
                    <Text style={[styles.subtitle, { color: theme.colors.subtext }]}>
                        Supports CSV and Excel files (.csv, .xlsx, .xls)
                    </Text>
                </View>

                <TouchableOpacity
                    style={[styles.dropZone, { borderStyle: 'dashed', borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}
                    onPress={pickDocument}
                >
                    {file ? (
                        <View style={styles.fileInfo}>
                            <Ionicons name="document" size={40} color={theme.colors.primary} />
                            <Text style={[styles.fileName, { color: theme.colors.text }]}>{file.name}</Text>
                            <Text style={[styles.fileSize, { color: theme.colors.subtext }]}>
                                {(file.size / 1024).toFixed(2)} KB
                            </Text>
                            <TouchableOpacity style={styles.removeBtn} onPress={() => setFile(null)}>
                                <Text style={styles.removeBtnText}>Remove file</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.emptyZone}>
                            <Ionicons name="add-circle-outline" size={48} color={theme.colors.subtext} />
                            <Text style={[styles.dropText, { color: theme.colors.text }]}>Tap to select a file</Text>
                            <Text style={[styles.dropSubtext, { color: theme.colors.subtext }]}>or browse your folders</Text>
                        </View>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.uploadButton,
                        { backgroundColor: theme.colors.primary, opacity: !file || uploading ? 0.6 : 1 }
                    ]}
                    onPress={handleUpload}
                    disabled={!file || uploading}
                >
                    {uploading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Ionicons name="arrow-up-circle" size={24} color="#fff" style={{ marginRight: 8 }} />
                            <Text style={styles.uploadButtonText}>Upload & Process</Text>
                        </>
                    )}
                </TouchableOpacity>

                <View style={[styles.infoCard, { backgroundColor: theme.colors.card }]}>
                    <Ionicons name="information-circle" size={20} color={theme.colors.primary} />
                    <Text style={[styles.infoText, { color: theme.colors.subtext }]}>
                        Data will be automatically analyzed for the dashboard after successful processing.
                    </Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        padding: 24,
    },
    header: {
        alignItems: 'center',
        padding: 24,
        borderRadius: 24,
        marginBottom: 24,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        textAlign: 'center',
    },
    dropZone: {
        flex: 1,
        maxHeight: 300,
        borderWidth: 2,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    emptyZone: {
        alignItems: 'center',
    },
    dropText: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 12,
    },
    dropSubtext: {
        fontSize: 14,
        marginTop: 4,
    },
    fileInfo: {
        alignItems: 'center',
    },
    fileName: {
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 12,
        textAlign: 'center',
    },
    fileSize: {
        fontSize: 12,
        marginTop: 4,
    },
    removeBtn: {
        marginTop: 16,
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    removeBtnText: {
        color: '#ef4444',
        fontWeight: '600',
    },
    uploadButton: {
        height: 56,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
    },
    uploadButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    infoCard: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    infoText: {
        flex: 1,
        fontSize: 12,
        marginLeft: 11,
        lineHeight: 18,
    },
});

export default UploadScreen;
