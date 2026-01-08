import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    Dimensions,
    ActivityIndicator,
} from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { analyticsAPI } from '../services/api';
import { useTheme } from '../context/ThemeContext';

const screenWidth = Dimensions.get('window').width;

const AnalyticsScreen = () => {
    const theme = useTheme();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const res = await analyticsAPI.getChartData();
            setData(res);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const chartConfig = {
        backgroundGradientFrom: theme.colors.card,
        backgroundGradientTo: theme.colors.card,
        color: (opacity = 1) => theme.dark ? `rgba(96, 165, 250, ${opacity})` : `rgba(37, 99, 235, ${opacity})`,
        strokeWidth: 2,
        barPercentage: 0.5,
        useShadowColorFromDataset: false,
        decimalPlaces: 0,
        labelColor: (opacity = 1) => theme.colors.subtext,
        style: {
            borderRadius: 16,
        },
        propsForDots: {
            r: '6',
            strokeWidth: '2',
            stroke: theme.colors.primary,
        },
    };

    // Sample data if backend is empty or during loading
    const dummyLineData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
            {
                data: [20, 45, 28, 80, 99, 43],
                color: (opacity = 1) => theme.colors.primary,
                strokeWidth: 2,
            },
        ],
    };

    const dummyBarData = {
        labels: ['Lekki', 'Ajah', 'Ikeja', 'Vi'],
        datasets: [
            {
                data: [300, 450, 200, 600],
            },
        ],
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={styles.content}>
            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text style={[styles.loadingText, { color: theme.colors.subtext }]}>Analyzing fleet data...</Text>
                </View>
            ) : (
                <>
                    <View style={[styles.chartSection, { backgroundColor: theme.colors.card }]}>
                        <Text style={[styles.chartTitle, { color: theme.colors.text }]}>Revenue Trend</Text>
                        <LineChart
                            data={data?.revenueTrend || dummyLineData}
                            width={screenWidth - 32}
                            height={220}
                            chartConfig={chartConfig}
                            bezier
                            style={styles.chartStyle}
                        />
                    </View>

                    <View style={[styles.chartSection, { backgroundColor: theme.colors.card }]}>
                        <Text style={[styles.chartTitle, { color: theme.colors.text }]}>Fleet Performance (PAX)</Text>
                        <BarChart
                            data={data?.fleetPerformance || dummyBarData}
                            width={screenWidth - 32}
                            height={220}
                            chartConfig={chartConfig}
                            verticalLabelRotation={30}
                            style={styles.chartStyle}
                        />
                    </View>

                    <View style={[styles.chartSection, { backgroundColor: theme.colors.card }]}>
                        <Text style={[styles.chartTitle, { color: theme.colors.text }]}>Revenue Distribution</Text>
                        <PieChart
                            data={[
                                { name: 'Fleet A', population: 400, color: '#3b82f6', legendFontColor: theme.colors.subtext, legendFontSize: 12 },
                                { name: 'Fleet B', population: 250, color: '#10b981', legendFontColor: theme.colors.subtext, legendFontSize: 12 },
                                { name: 'Fleet C', population: 150, color: '#f59e0b', legendFontColor: theme.colors.subtext, legendFontSize: 12 },
                            ]}
                            width={screenWidth - 32}
                            height={200}
                            chartConfig={chartConfig}
                            accessor="population"
                            backgroundColor="transparent"
                            paddingLeft="15"
                            absolute
                        />
                    </View>
                </>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 16,
    },
    centered: {
        marginTop: 100,
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
    },
    chartSection: {
        borderRadius: 24,
        padding: 16,
        marginBottom: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    chartTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    chartStyle: {
        marginVertical: 8,
        borderRadius: 16,
    },
});

export default AnalyticsScreen;
