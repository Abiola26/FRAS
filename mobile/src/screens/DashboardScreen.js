import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api, { dashboardAPI } from '../services/api';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

const KPICard = ({ title, value, icon, color, trend, theme }) => (
    <View style={[styles.card, { backgroundColor: theme.colors.card, borderLeftColor: color, borderLeftWidth: 4 }]}>
        <View style={styles.cardHeader}>
            <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
                <Ionicons name={icon} size={24} color={color} />
            </View>
            {trend && (
                <View style={[styles.trendBadge, { backgroundColor: theme.dark ? '#334155' : '#f1f5f9' }]}>
                    <Ionicons
                        name={trend > 0 ? "trending-up" : "trending-down"}
                        size={14}
                        color={trend > 0 ? "#10b981" : "#ef4444"}
                    />
                    <Text style={[styles.trendText, { color: trend > 0 ? "#10b981" : "#ef4444" }]}>
                        {Math.abs(trend)}%
                    </Text>
                </View>
            )}
        </View>
        <Text style={[styles.cardValue, { color: theme.colors.text }]}>{value}</Text>
        <Text style={[styles.cardTitle, { color: theme.colors.subtext }]}>{title}</Text>
    </View>
);

const DashboardScreen = () => {
    const theme = useTheme();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalRecords: 0,
        totalRevenue: 0,
        predictedRevenue: 0,
        topFleet: 'N/A',
        averageTrip: 0
    });
    const [recentLogs, setRecentLogs] = useState([]);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Only fetch audit logs if user is admin, standard users get 403 on this endpoint
            const fetchPromises = [dashboardAPI.getKPIs()];
            const isAdmin = user?.role === 'admin';

            if (isAdmin) {
                fetchPromises.push(api.get('/audit', { params: { limit: 5 } }));
            }

            const results = await Promise.all(fetchPromises);

            setStats(results[0]);
            if (isAdmin && results[1]) {
                setRecentLogs(results[1].data);
            } else {
                setRecentLogs([]);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const onRefresh = useCallback(() => {
        fetchData();
    }, []);

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            maximumFractionDigits: 0
        }).format(val);
    };

    const getTimeAgo = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return 'just now';
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h ago`;
        return date.toLocaleDateString();
    };

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: theme.colors.background }]}
            refreshControl={
                <RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor={theme.colors.primary} />
            }
        >
            <StatusBar style={theme.dark ? "light" : "dark"} />
            <View style={[styles.header, { backgroundColor: theme.colors.header }]}>
                <Text style={styles.greeting}>Overview</Text>
                <Text style={styles.date}>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
            </View>

            <View style={styles.statsGrid}>
                <KPICard
                    title="Revenue"
                    value={formatCurrency(stats.totalRevenue)}
                    icon="trending-up"
                    color="#10b981"
                    theme={theme}
                />
                <KPICard
                    title="Records"
                    value={stats.totalRecords.toLocaleString()}
                    icon="document-text"
                    color="#3b82f6"
                    theme={theme}
                />
                <KPICard
                    title="Predicted/Day"
                    value={formatCurrency(stats.predictedRevenue)}
                    icon="analytics"
                    color="#0891b2"
                    theme={theme}
                />
                <KPICard
                    title="Top Fleet"
                    value={stats.topFleet}
                    icon="bus"
                    color="#8b5cf6"
                    theme={theme}
                />
            </View>

            {user?.role === 'admin' && (
                <View style={styles.recentActivity}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Recent System Activity</Text>
                    </View>

                    {recentLogs.length > 0 ? (
                        recentLogs.map((log, index) => (
                            <View key={log.id || index} style={[styles.activityItem, { borderLeftColor: theme.colors.primary }]}>
                                <View style={[styles.activityIcon, { backgroundColor: `${theme.colors.primary}10` }]}>
                                    <Ionicons
                                        name={log.action.includes('UPLOAD') ? 'cloud-upload' : log.action.includes('SETTING') ? 'settings' : 'person'}
                                        size={18}
                                        color={theme.colors.primary}
                                    />
                                </View>
                                <View style={styles.activityContent}>
                                    <Text style={[styles.activityAction, { color: theme.colors.text }]}>
                                        {log.action.replace(/_/g, ' ')}
                                    </Text>
                                    <Text style={[styles.activityUser, { color: theme.colors.subtext }]}>
                                        by {log.username} • {getTimeAgo(log.timestamp)}
                                    </Text>
                                </View>
                            </View>
                        ))
                    ) : (
                        <Text style={[styles.emptyText, { color: theme.colors.subtext }]}>No recent activity</Text>
                    )}
                </View>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 24,
        paddingTop: 32,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        marginBottom: 24,
    },
    greeting: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
    },
    date: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: 4,
    },
    statsGrid: {
        paddingHorizontal: 16,
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    card: {
        width: (width - 48) / 2,
        padding: 20,
        borderRadius: 24,
        marginBottom: 16,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardValue: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    cardTitle: {
        fontSize: 12,
        fontWeight: '500',
    },
    trendBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
    },
    trendText: {
        fontSize: 10,
        fontWeight: 'bold',
        marginLeft: 2,
    },
    recentActivity: {
        padding: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    insightCard: {
        padding: 20,
        borderRadius: 20,
        borderLeftWidth: 4,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
    },
    insightText: {
        fontSize: 14,
        lineHeight: 22,
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        backgroundColor: 'rgba(0,0,0,0.02)',
        marginBottom: 12,
        borderLeftWidth: 4,
    },
    activityIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    activityContent: {
        flex: 1,
        marginLeft: 12,
    },
    activityAction: {
        fontSize: 14,
        fontWeight: 'bold',
        textTransform: 'capitalize',
    },
    activityUser: {
        fontSize: 12,
        marginTop: 2,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 20,
        fontSize: 14,
    },
});

export default DashboardScreen;
