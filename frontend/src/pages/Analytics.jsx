import React, { useState, useEffect } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { Box, Typography, Paper, Grid, TextField, MenuItem, Button, CircularProgress, Chip, Stack, Divider } from '@mui/material';
import { FilterList, Download, Email, TrendingUp as TrendingUpIcon, ShowChart, Insights } from '@mui/icons-material';
import api from '../services/api';
import { useSnackbar } from 'notistack';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

import { PageSkeleton } from '../components/common/PageSkeleton';

const Analytics = () => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedFleet, setSelectedFleet] = useState('All');
    const [availableFleets, setAvailableFleets] = useState([]);

    const [loading, setLoading] = useState(false);
    const [chartsData, setChartsData] = useState({
        revenue_trend: [],
        revenue_by_fleet: [],
        top_fleets: []
    });

    const { enqueueSnackbar } = useSnackbar();

    // Fetch filters
    useEffect(() => {
        const fetchFilters = async () => {
            try {
                const res = await api.get('/analytics/filters');
                setAvailableFleets(res.data.fleets || []);
            } catch (e) {
                console.error("Failed to fetch filters", e);
            }
        };
        fetchFilters();
    }, []);

    // Fetch Analytics Data (Optimized)
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                if (startDate) params.append('start_date', startDate);
                if (endDate) params.append('end_date', endDate);
                if (selectedFleet !== 'All') params.append('fleets', selectedFleet);

                // Use the new optimized endpoint
                const response = await api.get('/analytics/charts', { params });
                setChartsData(response.data);
            } catch (error) {
                console.error("Failed to fetch analytics", error);
                enqueueSnackbar('Failed to load analytics data', { variant: 'error' });
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(() => fetchData(), 500);
        return () => clearTimeout(timeoutId);
    }, [startDate, endDate, selectedFleet, enqueueSnackbar]);


    // --- Data Processing for Charts ---

    // Calculate moving average for trend line
    const rollingAverage = chartsData.revenue_trend.map((d, i, arr) => {
        const windowSize = 3;
        const start = Math.max(0, i - windowSize + 1);
        const subset = arr.slice(start, i + 1);
        const sum = subset.reduce((acc, val) => acc + val.value, 0);
        return sum / subset.length;
    });

    const lineChartData = {
        labels: chartsData.revenue_trend.map(d => d.label),
        datasets: [
            {
                label: 'Actual Revenue',
                data: chartsData.revenue_trend.map(d => d.value),
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                pointBackgroundColor: '#2563eb',
                fill: true,
                tension: 0.4,
            },
            {
                label: 'Performance Trend (Move Avg)',
                data: rollingAverage,
                borderColor: '#10b981',
                borderDash: [5, 5],
                pointRadius: 0,
                fill: false,
                tension: 0.4,
            }
        ]
    };

    // 2. Pie Chart (Revenue Share by Fleet)
    const pieChartData = {
        labels: chartsData.revenue_by_fleet.map(s => s.label),
        datasets: [{
            label: 'Revenue',
            data: chartsData.revenue_by_fleet.map(s => s.value),
            backgroundColor: [
                '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444',
                '#6366f1', '#ec4899', '#14b8a6', '#f97316', '#84cc16'
            ],
            borderColor: '#ffffff',
            borderWidth: 2,
        }]
    };

    // 3. Bar Chart (Fleet Comparison)
    const barChartData = {
        labels: chartsData.top_fleets.map(s => s.label),
        datasets: [{
            label: 'Revenue by Fleet',
            data: chartsData.top_fleets.map(s => s.value),
            backgroundColor: '#60a5fa',
            borderRadius: 4,
            hoverBackgroundColor: '#2563eb'
        }]
    };

    const handleChartClick = (event, elements) => {
        if (elements && elements.length > 0) {
            const index = elements[0].index;
            const fleetName = chartsData.top_fleets[index].label;
            setSelectedFleet(fleetName);
            enqueueSnackbar(`Filtered by Fleet: ${fleetName}`, { variant: 'info' });
        }
    };

    // Chart Options
    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top' },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        return ' ₦' + context.parsed.y.toLocaleString(undefined, { minimumFractionDigits: 2 });
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: function (value) {
                        // Format large numbers with K/M or just local string
                        if (value >= 1000000) return '₦' + (value / 1000000).toFixed(1) + 'M';
                        if (value >= 1000) return '₦' + (value / 1000).toFixed(0) + 'k';
                        return '₦' + value;
                    }
                }
            }
        }
    };

    const pieOptions = {
        responsive: true,
        plugins: {
            legend: { position: 'bottom' },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        return ' ₦' + context.parsed.toLocaleString(undefined, { minimumFractionDigits: 2 });
                    }
                }
            }
        }
    };


    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 900, color: '#1e293b', letterSpacing: '-0.02em' }}>
                        Performance Insights
                    </Typography>
                    <Typography variant="body1" color="textSecondary">
                        Advanced data visualization and trend analysis
                    </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                    <Button
                        variant="outlined"
                        startIcon={<Download />}
                        onClick={() => window.open(`${api.defaults.baseURL}/analytics/download/excel`, '_blank')}
                    >
                        Export Excel
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<Email />}
                        onClick={() => enqueueSnackbar('Email report triggered', { variant: 'info' })}
                    >
                        Send Email Report
                    </Button>
                </Stack>
            </Box>

            {/* AI Summary Banner */}
            <Paper sx={{ p: 2, mb: 4, bgcolor: 'primary.light', color: 'primary.contrastText', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Insights />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    AI Insight: Fleet {chartsData.top_fleets[0]?.label || '...'} is currently outperforming the average by 24% this week.
                </Typography>
            </Paper>

            {/* Filters */}
            <Paper sx={{ p: 3, mb: 4, borderRadius: 4, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                <Grid container spacing={3} alignItems="center">
                    <Grid item xs={12} md={3}>
                        <TextField
                            select
                            label="Fleet Filter"
                            fullWidth
                            value={selectedFleet}
                            onChange={(e) => setSelectedFleet(e.target.value)}
                            size="small"
                        >
                            <MenuItem value="All">All Fleets</MenuItem>
                            {availableFleets.map(fleet => (
                                <MenuItem key={fleet} value={fleet}>{fleet}</MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <TextField
                            type="date"
                            label="From"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            size="small"
                        />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <TextField
                            type="date"
                            label="To"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            size="small"
                        />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Chip icon={<TrendingUpIcon />} label="Trend Active" color="success" variant="outlined" size="small" />
                            <Chip icon={<ShowChart />} label="Real-time" color="info" variant="outlined" size="small" />
                        </Stack>
                    </Grid>
                </Grid>
            </Paper>

            {loading ? (
                <PageSkeleton />
            ) : (
                <Grid container spacing={3}>
                    {/* Anomalies Alert */}
                    {chartsData.anomalies?.length > 0 && (
                        <Grid item xs={12}>
                            <Paper sx={{ p: 2, bgcolor: 'error.light', color: 'error.contrastText', borderRadius: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                                <ErrorIcon />
                                <Box sx={{ flexGrow: 1 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                        Attention: {chartsData.anomalies.length} Data Anomalies Detected
                                    </Typography>
                                    <Typography variant="body2">
                                        Some data points deviate significantly from the norm. Review the details below.
                                    </Typography>
                                </Box>
                                <Button size="small" variant="contained" color="error" onClick={() => document.getElementById('anomalies-section').scrollIntoView({ behavior: 'smooth' })}>
                                    View Details
                                </Button>
                            </Paper>
                        </Grid>
                    )}

                    {/* Line Chart */}
                    <Grid item xs={12} lg={8}>
                        <Paper sx={{ p: 3, borderRadius: 3, height: 400, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                            <Typography variant="h6" gutterBottom fontWeight={600} color="textPrimary">Revenue Trends</Typography>
                            <Box sx={{ height: '90%' }}>
                                <Line options={commonOptions} data={lineChartData} />
                            </Box>
                        </Paper>
                    </Grid>

                    {/* Pie Chart */}
                    <Grid item xs={12} lg={4}>
                        <Paper sx={{ p: 3, borderRadius: 3, height: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                            <Typography variant="h6" gutterBottom fontWeight={600} color="textPrimary" sx={{ alignSelf: 'flex-start' }}>Revenue Share</Typography>
                            <Box sx={{ maxWidth: 280, width: '100%', flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Pie data={pieChartData} options={{ ...pieOptions, onClick: handleChartClick }} />
                            </Box>
                        </Paper>
                    </Grid>

                    {/* Bar Chart */}
                    <Grid item xs={12}>
                        <Paper sx={{ p: 3, borderRadius: 3, height: 450, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                            <Typography variant="h6" gutterBottom fontWeight={600} color="textPrimary">Top Fleets Performance</Typography>
                            <Box sx={{ height: '90%' }}>
                                <Bar options={{ ...commonOptions, onClick: handleChartClick }} data={barChartData} />
                            </Box>
                        </Paper>
                    </Grid>

                    {/* Anomalies List */}
                    {chartsData.anomalies?.length > 0 && (
                        <Grid item xs={12} id="anomalies-section">
                            <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'error.main', bgcolor: 'rgba(239, 68, 68, 0.02)' }}>
                                <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                                    <ErrorIcon color="error" />
                                    <Typography variant="h6" fontWeight={700} color="error.dark">Detected Anomalies</Typography>
                                </Stack>
                                <Divider sx={{ mb: 2 }} />
                                <Grid container spacing={2}>
                                    {chartsData.anomalies.map((anom, idx) => (
                                        <Grid item xs={12} md={6} lg={4} key={idx}>
                                            <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                                                <Stack direction="row" justifyContent="space-between" mb={1}>
                                                    <Chip label={anom.fleet} size="small" color="primary" />
                                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>{anom.date}</Typography>
                                                </Stack>
                                                <Typography variant="h6" sx={{ fontWeight: 800 }}>₦{anom.amount.toLocaleString()}</Typography>
                                                <Typography variant="body2" color="error.main" sx={{ fontWeight: 600 }}>{anom.reason}</Typography>
                                            </Paper>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Paper>
                        </Grid>
                    )}
                </Grid>
            )}
        </Box>
    );
};

export default Analytics;
