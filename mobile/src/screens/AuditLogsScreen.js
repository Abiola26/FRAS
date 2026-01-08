import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    FlatList,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auditAPI } from '../services/api';
import { useTheme } from '../context/ThemeContext';

const AuditLogItem = ({ item, isLast, theme }) => (
    <View style={styles.logRow}>
        <View style={styles.timelineCol}>
            <View style={[styles.dot, { backgroundColor: theme.colors.primary }]} />
            {!isLast && <View style={[styles.line, { backgroundColor: theme.colors.border }]} />}
        </View>
        <View style={[styles.contentCol, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <View style={styles.logHeader}>
                <View style={styles.actionTag}>
                    <Text style={styles.actionText}>{item.action}</Text>
                </View>
                <Text style={[styles.logDate, { color: theme.colors.subtext }]}>
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </View>
            <Text style={[styles.logMsg, { color: theme.colors.text }]}>{item.details}</Text>
            <Text style={[styles.logUser, { color: theme.colors.subtext }]}>by {item.user_email || 'System'}</Text>
        </View>
    </View>
);

const AuditLogsScreen = () => {
    const theme = useTheme();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const res = await auditAPI.getLogs();
            setLogs(res.logs || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={logs}
                    renderItem={({ item, index }) => (
                        <AuditLogItem
                            item={item}
                            isLast={index === logs.length - 1}
                            theme={theme}
                        />
                    )}
                    keyExtractor={(item, index) => index.toString()}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="list-outline" size={48} color={theme.colors.border} />
                            <Text style={[styles.emptyText, { color: theme.colors.subtext }]}>No logs found</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    listContent: {
        padding: 20,
    },
    logRow: {
        flexDirection: 'row',
    },
    timelineCol: {
        width: 24,
        alignItems: 'center',
    },
    dot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        zIndex: 1,
    },
    line: {
        width: 2,
        flex: 1,
        marginVertical: -2,
    },
    contentCol: {
        flex: 1,
        marginLeft: 12,
        marginBottom: 24,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.02,
        shadowRadius: 5,
    },
    logHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    actionTag: {
        backgroundColor: '#eff6ff',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    actionText: {
        color: '#2563eb',
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    logDate: {
        fontSize: 11,
    },
    logMsg: {
        fontSize: 14,
        fontWeight: '500',
        lineHeight: 20,
    },
    logUser: {
        fontSize: 11,
        marginTop: 8,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 100,
    },
    emptyText: {
        marginTop: 12,
        fontSize: 16,
    },
});

export default AuditLogsScreen;
