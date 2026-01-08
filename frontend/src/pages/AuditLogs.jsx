import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Button
} from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';
import api from '../services/api';
import { useSnackbar } from 'notistack';

const AuditLogs = () => {
    const [logs, setLogs] = useState([]);
    const { enqueueSnackbar } = useSnackbar();

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const res = await api.get('/audit');
                setLogs(res.data);
            } catch (error) {
                console.error(error);
                enqueueSnackbar('Failed to fetch audit logs', { variant: 'error' });
            }
        };
        fetchLogs();
    }, []);

    const exportToCSV = () => {
        if (logs.length === 0) return;
        const headers = ['Timestamp,User,Action,Details'];
        const rows = logs.map(log => {
            const date = new Date(log.timestamp).toLocaleString().replace(/,/g, '');
            return `${date},${log.username},${log.action},"${(log.details || '').replace(/"/g, '""')}"`;
        });
        const csvContent = headers.concat(rows).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 800 }}>Audit Logs</Typography>
                <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={exportToCSV}
                    disabled={logs.length === 0}
                >
                    Export CSV
                </Button>
            </Box>
            <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
                <TableContainer sx={{ maxHeight: '75vh' }}>
                    <Table stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell>Timestamp</TableCell>
                                <TableCell>User</TableCell>
                                <TableCell>Action</TableCell>
                                <TableCell>Details</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {logs.map((log) => (
                                <TableRow key={log.id} hover>
                                    <TableCell sx={{ whiteSpace: 'nowrap', color: 'text.secondary' }}>
                                        {new Date(log.timestamp).toLocaleString()}
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>
                                        {log.username}
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={log.action}
                                            size="small"
                                            color={log.action.includes('DELETE') || log.action.includes('FAILED') ? 'error' : log.action.includes('LOGIN') ? 'info' : 'success'}
                                            variant="outlined"
                                        />
                                    </TableCell>
                                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                                        {log.details || '-'}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
};

export default AuditLogs;
