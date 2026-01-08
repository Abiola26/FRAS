import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet,
    View,
    Text,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    TextInput,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { reportsAPI } from '../services/api';
import { useTheme } from '../context/ThemeContext';

const ReportItem = ({ item, theme }) => (
    <View style={[styles.itemCard, { backgroundColor: theme.colors.card }]}>
        <View style={styles.itemHeader}>
            <View style={styles.busInfo}>
                <View style={styles.busBadge}>
                    <Ionicons name="bus" size={12} color="#fff" />
                </View>
                <Text style={[styles.busCode, { color: theme.colors.text }]}>{item.bus_code}</Text>
            </View>
            <Text style={[styles.dateText, { color: theme.colors.subtext }]}>{new Date(item.date).toLocaleDateString()}</Text>
        </View>
        <View style={styles.itemBody}>
            <View style={styles.dataCol}>
                <Text style={styles.dataLabel}>PAX</Text>
                <Text style={[styles.dataValue, { color: theme.colors.text }]}>{item.pax}</Text>
            </View>
            <View style={styles.dataCol}>
                <Text style={styles.dataLabel}>Revenue</Text>
                <Text style={[styles.dataValue, { color: '#10b981' }]}>₦{Number(item.revenue).toLocaleString()}</Text>
            </View>
            <View style={styles.dataCol}>
                <Text style={styles.dataLabel}>Remitt.</Text>
                <Text style={[styles.dataValue, { color: theme.colors.primary }]}>₦{Number(item.remittance || 0).toLocaleString()}</Text>
            </View>
        </View>
    </View>
);

const ReportsScreen = () => {
    const theme = useTheme();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
    const [filterDate, setFilterDate] = useState(null);

    const fetchReports = useCallback(async () => {
        try {
            setLoading(true);
            const params = {};
            if (filterDate) {
                params.start_date = filterDate.toISOString().split('T')[0];
                params.end_date = filterDate.toISOString().split('T')[0];
            }
            const data = await reportsAPI.getReports(params);
            setReports(data.reports || []);
        } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Failed to fetch reports. Please check your connection.');
        } finally {
            setLoading(false);
        }
    }, [filterDate]);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    const handleConfirmDate = (date) => {
        setFilterDate(date);
        setDatePickerVisibility(false);
    };

    const clearFilters = () => {
        setFilterDate(null);
        setSearch('');
    };

    const exportToCSV = async () => {
        if (reports.length === 0) {
            Alert.alert('No Data', 'There are no records to export.');
            return;
        }

        try {
            let csvContent = 'Date,Bus Code,PAX,Revenue,Remittance\n';
            reports.forEach(r => {
                csvContent += `${r.date},${r.bus_code},${r.pax},${r.revenue},${r.remittance || 0}\n`;
            });

            const fileName = `FRAS_Report_${new Date().getTime()}.csv`;
            const fileUri = FileSystem.documentDirectory + fileName;

            await FileSystem.writeAsStringAsync(fileUri, csvContent, { encoding: FileSystem.EncodingType.UTF8 });

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(fileUri);
            } else {
                Alert.alert('Export Complete', `Report saved to: ${fileUri}`);
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to export report');
        }
    };

    const filteredReports = reports.filter(r =>
        r.bus_code.toLowerCase().includes(search.toLowerCase())
    );

    const totals = filteredReports.reduce((acc, curr) => ({
        pax: acc.pax + (Number(curr.pax) || 0),
        revenue: acc.revenue + (Number(curr.revenue) || 0),
    }), { pax: 0, revenue: 0 });

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={[styles.topSummary, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}>
                <View style={styles.summaryItem}>
                    <Text style={[styles.summaryLabel, { color: theme.colors.subtext }]}>Total PAX</Text>
                    <Text style={[styles.summaryValue, { color: theme.colors.text }]}>{totals.pax.toLocaleString()}</Text>
                </View>
                <View style={[styles.summaryItem, styles.summaryBorder, { borderLeftColor: theme.colors.border }]}>
                    <Text style={[styles.summaryLabel, { color: theme.colors.subtext }]}>Total Revenue</Text>
                    <Text style={[styles.summaryValue, { color: '#10b981' }]}>₦{totals.revenue.toLocaleString()}</Text>
                </View>
            </View>

            <View style={styles.searchContainer}>
                <View style={[styles.searchBox, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                    <Ionicons name="search" size={18} color={theme.colors.subtext} />
                    <TextInput
                        style={[styles.searchInput, { color: theme.colors.text }]}
                        placeholder="Search Bus Code..."
                        value={search}
                        onChangeText={setSearch}
                        placeholderTextColor={theme.colors.subtext}
                    />
                </View>
                <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }, filterDate && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }]}
                    onPress={() => setDatePickerVisibility(true)}
                >
                    <Ionicons name="calendar" size={20} color={filterDate ? "#fff" : theme.colors.primary} />
                </TouchableOpacity>
                {(filterDate || search) && (
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]} onPress={clearFilters}>
                        <Ionicons name="refresh" size={20} color={theme.colors.subtext} />
                    </TouchableOpacity>
                )}
            </View>

            {filterDate && (
                <View style={[styles.filterTag, { backgroundColor: theme.colors.primary + '15', borderColor: theme.colors.primary + '30' }]}>
                    <Text style={[styles.filterTagText, { color: theme.colors.primary }]}>Date: {filterDate.toLocaleDateString()}</Text>
                    <TouchableOpacity onPress={() => setFilterDate(null)}>
                        <Ionicons name="close-circle" size={16} color={theme.colors.primary} />
                    </TouchableOpacity>
                </View>
            )}

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={filteredReports}
                    renderItem={({ item }) => <ReportItem item={item} theme={theme} />}
                    keyExtractor={(item, index) => index.toString()}
                    contentContainerStyle={styles.listContent}
                    onRefresh={fetchReports}
                    refreshing={loading}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="document-text-outline" size={64} color={theme.colors.border} />
                            <Text style={[styles.emptyText, { color: theme.colors.subtext }]}>No matching records found</Text>
                            <TouchableOpacity style={styles.resetLink} onPress={clearFilters}>
                                <Text style={styles.resetLinkText}>Clear all filters</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            )}

            <TouchableOpacity style={styles.fab} onPress={exportToCSV}>
                <Ionicons name="download" size={24} color="#fff" />
            </TouchableOpacity>

            <DateTimePickerModal
                isVisible={isDatePickerVisible}
                mode="date"
                onConfirm={handleConfirmDate}
                onCancel={() => setDatePickerVisibility(false)}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    topSummary: {
        flexDirection: 'row',
        paddingVertical: 16,
        borderBottomWidth: 1,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
    },
    summaryItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    summaryBorder: {
        borderLeftWidth: 1,
    },
    summaryLabel: {
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    summaryValue: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 10,
    },
    searchBox: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        borderRadius: 12,
        height: 48,
        borderWidth: 1,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 15,
    },
    actionBtn: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    filterTag: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        marginHorizontal: 16,
        marginBottom: 8,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
    },
    filterTagText: {
        fontSize: 12,
        marginRight: 6,
        fontWeight: '500',
    },
    listContent: {
        padding: 16,
        paddingBottom: 100,
    },
    itemCard: {
        borderRadius: 20,
        marginBottom: 16,
        padding: 16,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    busInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    busBadge: {
        width: 24,
        height: 24,
        borderRadius: 8,
        backgroundColor: '#2563eb',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    busCode: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    dateText: {
        fontSize: 13,
    },
    itemBody: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    dataCol: {
        flex: 1,
    },
    dataLabel: {
        fontSize: 10,
        color: '#94a3b8',
        textTransform: 'uppercase',
        marginBottom: 6,
    },
    dataValue: {
        fontSize: 15,
        fontWeight: '700',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 60,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        fontWeight: '500',
    },
    resetLink: {
        marginTop: 12,
    },
    resetLinkText: {
        color: '#2563eb',
        fontWeight: '600',
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#2563eb',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#2563eb',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
});

export default ReportsScreen;
