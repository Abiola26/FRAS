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
    Button,
    TextField,
    MenuItem,
    Grid,
    Chip,
    CircularProgress,
    TablePagination,
    IconButton,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle
} from '@mui/material';
import { Download, Delete, Edit as EditIcon } from '@mui/icons-material';
import api from '../services/api';
import { useSnackbar } from 'notistack';
import { useAuth } from '../context/AuthContext';

const Reports = () => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedFleet, setSelectedFleet] = useState('All');
    const [availableFleets, setAvailableFleets] = useState([]);

    const [data, setData] = useState({
        records: [],
        fleet_summaries: [],
        daily_subtotals: [],
        dashboard_stats: { total_revenue: 0 }
    });


    const [loading, setLoading] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(50);

    // Check confirmation Dialog state
    const [openDialog, setOpenDialog] = useState(false);
    const [deleteType, setDeleteType] = useState(null); // 'single' or 'batch'
    const [recordToDelete, setRecordToDelete] = useState(null);

    // Record editing state
    const [editRecord, setEditRecord] = useState(null); // { id, date, fleet, amount }
    const [editSaving, setEditSaving] = useState(false);

    const [recordPage, setRecordPage] = useState(0);
    const [recordRowsPerPage, setRecordRowsPerPage] = useState(50);

    const { enqueueSnackbar } = useSnackbar();
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';

    // Fetch available fleets on mount
    useEffect(() => {
        const fetchFilters = async () => {
            try {
                const res = await api.get('/analytics/filters');
                setAvailableFleets(res.data.fleets || []);
            } catch {
                // Silently handle filter fetch errors
            }
        };
        fetchFilters();
    }, []);

    // Fetch report data when filters change
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                if (startDate) params.append('start_date', startDate);
                if (endDate) params.append('end_date', endDate);
                if (selectedFleet !== 'All') params.append('fleets', selectedFleet);

                const response = await api.get('/analytics/summary', { params });
                setData(response.data);
            } catch {
                enqueueSnackbar('Failed to load report data', { variant: 'error' });
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(() => fetchData(), 300);
        return () => clearTimeout(timeoutId);
    }, [startDate, endDate, selectedFleet, enqueueSnackbar]);

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleChangeRecordPage = (event, newPage) => {
        setRecordPage(newPage);
    };

    const handleChangeRecordRowsPerPage = (event) => {
        setRecordRowsPerPage(parseInt(event.target.value, 10));
        setRecordPage(0);
    };

    const handleDeleteClick = (id) => {
        setDeleteType('single');
        setRecordToDelete(id);
        setOpenDialog(true);
    };

    const handleBatchDeleteClick = () => {
        setDeleteType('batch');
        setOpenDialog(true);
    };

    const handleEditClick = (row) => {
        setEditRecord({
            id: row.id,
            date: typeof row.date === 'string' ? row.date.slice(0, 10) : '',
            fleet: row.fleet,
            amount: row.amount
        });
    };

    const handleEditSave = async () => {
        try {
            setEditSaving(true);
            await api.put(`/fleet/${editRecord.id}`, {
                date: editRecord.date,
                fleet: editRecord.fleet.trim(),
                amount: parseFloat(editRecord.amount)
            });
            enqueueSnackbar('Record updated successfully', { variant: 'success' });
            setEditRecord(null);
            refreshData();
        } catch (error) {
            const detail = error.response?.data?.detail;
            enqueueSnackbar(detail || 'Failed to update record', { variant: 'error' });
        } finally {
            setEditSaving(false);
        }
    };

    const handleConfirmDelete = async () => {
        setOpenDialog(false);

        if (deleteType === 'single') {
            try {
                await api.delete(`/fleet/${recordToDelete}`);
                enqueueSnackbar('Record deleted successfully', { variant: 'success' });
                refreshData();
        } catch {
            enqueueSnackbar('Failed to delete record', { variant: 'error' });
            }
        } else if (deleteType === 'batch') {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                if (startDate) params.append('start_date', startDate);
                if (endDate) params.append('end_date', endDate);
                if (selectedFleet !== 'All') params.append('fleet', selectedFleet);

                const res = await api.delete('/fleet/batch', { params });
                enqueueSnackbar(res.data.message || 'Records deleted', { variant: 'success' });
                refreshData();
        } catch {
            enqueueSnackbar('Failed to delete records', { variant: 'error' });
            } finally {
                setLoading(false);
            }
        }
    };

    const refreshData = async () => {
        const params = new URLSearchParams();
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);
        if (selectedFleet !== 'All') params.append('fleets', selectedFleet);
        try {
            const response = await api.get('/analytics/summary', { params });
            setData(response.data);
        } catch {
            // Silently handle refresh errors
        }
    };

    const handleDownload = async (type) => {
        setDownloading(true);
        try {
            // Build params as a plain object so axios reliably serializes them,
            // especially when combined with responseType: 'blob'.
            const params = {};
            if (startDate) params.start_date = startDate;
            if (endDate) params.end_date = endDate;
            if (selectedFleet !== 'All') params.fleets = selectedFleet;

            const response = await api.get(`/analytics/download/${type}`, {
                params,
                responseType: 'blob'
            });

            // response.data is already a Blob when responseType is 'blob'
            // Do NOT wrap it in new Blob([...]) — that can corrupt binary files
            const url = window.URL.createObjectURL(response.data);
            const link = document.createElement('a');

            // Use the filename from Content-Disposition header if available,
            // otherwise fall back to a descriptive name based on active filters.
            const disposition = response.headers['content-disposition'];
            let filename;
            if (disposition) {
                const match = disposition.match(/filename[^;=\n]*=((['"]).+?\2|[^;\n]*)/);
                filename = match ? match[1].replace(/["']/g, '') : null;
            }
            if (!filename) {
                const fromLabel = startDate || 'all';
                const toLabel = endDate || 'all';
                const ext = type === 'excel' ? 'xlsx' : 'pdf';
                filename = `Fleet_Report_${fromLabel}_to_${toLabel}.${ext}`;
            }

            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            enqueueSnackbar(`${type.toUpperCase()} report downloaded successfully`, { variant: 'success' });
        } catch (error) {
            // When responseType is 'blob', error.response.data is also a Blob.
            // Convert it to text so we can show a meaningful error message.
            let message = `Failed to download ${type} report`;
            if (error.response && error.response.data instanceof Blob) {
                try {
                    const text = await error.response.data.text();
                    const json = JSON.parse(text);
                    if (json.detail) message = json.detail;
                } catch {
                    // ignore parse errors, use default message
                }
            }
            enqueueSnackbar(message, { variant: 'error' });
        } finally {
            setDownloading(false);
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary' }}>
                        Reports
                    </Typography>
                    <Typography variant="body1" color="textSecondary">
                        Detailed fleet operation logs and summaries
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    {isAdmin && (
                        <Button
                            variant="outlined"
                            color="error"
                            startIcon={<Delete />}
                            onClick={handleBatchDeleteClick}
                            disabled={loading}
                        >
                            Delete Filtered
                        </Button>
                    )}
                    <Button
                        variant="outlined"
                        startIcon={downloading ? <CircularProgress size={16} /> : <Download />}
                        onClick={() => handleDownload('excel')}
                        disabled={loading || downloading}
                    >
                        {downloading ? 'Downloading...' : 'Export Excel'}
                    </Button>
                </Box>
            </Box>

            <Paper sx={{ p: 3, mb: 4, borderRadius: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={3}>
                        <TextField
                            select
                            label="Fleet"
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
                            label="Start Date"
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
                            label="End Date"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            size="small"
                        />
                    </Grid>
                    <Grid item xs={12} md={3} />
                </Grid>
            </Paper>

            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: 'text.primary' }}>
                Fleet Performance
            </Typography>

            <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: 3, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                {loading && (
                    <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
                        <CircularProgress />
                    </Box>
                )}

                {!loading && (
                    <>
                        <TableContainer sx={{ maxHeight: 600 }}>
                            <Table stickyHeader aria-label="fleet performance table">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 700 }}>BUS CODE</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 700 }}>PAX</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700 }}>REVENUE</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700 }}>REMITTANCE</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {data.fleet_summaries && data.fleet_summaries.length > 0 ? (
                                        data.fleet_summaries
                                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                            .map((row) => (
                                                <TableRow hover key={row.fleet}>
                                                    <TableCell>
                                                        <Chip label={row.fleet} size="small" variant="outlined" color="primary" sx={{ borderRadius: 1 }} />
                                                    </TableCell>
                                                    <TableCell align="center">{row.record_count}</TableCell>
                                                    <TableCell align="right" sx={{ color: 'success.main', fontWeight: 600 }}>
                                                        ₦{row.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ color: 'info.main', fontWeight: 600 }}>
                                                        ₦{(row.remittance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                                                No fleet data found
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <TablePagination
                            rowsPerPageOptions={[50, 100, 200]}
                            component="div"
                            count={data.fleet_summaries ? data.fleet_summaries.length : 0}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            onPageChange={handleChangePage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                        />
                    </>
                )}
            </Paper>

            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: 'text.primary', mt: 4 }}>
                Detailed Records
            </Typography>


            <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: 3, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                <TableContainer sx={{ maxHeight: 600 }}>
                    <Table stickyHeader size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Fleet</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700 }}>Amount</TableCell>
                                {isAdmin && <TableCell align="center" sx={{ fontWeight: 700 }}>Actions</TableCell>}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {data.records && data.records.length > 0 ? (
                                data.records.slice(recordPage * recordRowsPerPage, recordPage * recordRowsPerPage + recordRowsPerPage).map((row) => (
                                    <TableRow hover key={row.id}>
                                        <TableCell>{row.date}</TableCell>
                                        <TableCell>{row.fleet}</TableCell>
                                        <TableCell align="right">₦{row.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                                        {isAdmin && (
                                            <TableCell align="center">
                                                <IconButton size="small" onClick={() => handleEditClick(row)} color="primary">
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton size="small" onClick={() => handleDeleteClick(row.id)} color="error">
                                                    <Delete fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={isAdmin ? 4 : 3} align="center" sx={{ py: 4 }}>No records found</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    rowsPerPageOptions={[50, 100, 200]}
                    component="div"
                    count={data.records ? data.records.length : 0}
                    rowsPerPage={recordRowsPerPage}
                    page={recordPage}
                    onPageChange={handleChangeRecordPage}
                    onRowsPerPageChange={handleChangeRecordRowsPerPage}
                />
            </Paper>
            <Dialog
                open={openDialog}
                onClose={() => setOpenDialog(false)}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">
                    {"Confirm Deletion"}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        {deleteType === 'batch'
                            ? "WARNING: You are about to DELETE all records that match the current filters. This action CANNOT be undone. Are you sure?"
                            : "Are you sure you want to delete this record? This action cannot be undone."
                        }
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)} autoFocus>
                        Cancel
                    </Button>
                    <Button onClick={handleConfirmDelete} color="error" variant="contained">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Edit Record Dialog */}
            <Dialog open={Boolean(editRecord)} onClose={() => setEditRecord(null)}>
                <DialogTitle>Edit Record #{editRecord?.id}</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ pt: 1 }}>
                        <Grid item xs={12}>
                            <TextField
                                label="Date"
                                type="date"
                                fullWidth
                                value={editRecord?.date || ''}
                                onChange={(e) => setEditRecord({ ...editRecord, date: e.target.value })}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                label="Fleet"
                                fullWidth
                                required
                                value={editRecord?.fleet || ''}
                                onChange={(e) => setEditRecord({ ...editRecord, fleet: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                label="Amount"
                                type="number"
                                fullWidth
                                required
                                inputProps={{ min: 0, step: '0.01' }}
                                value={editRecord?.amount ?? ''}
                                onChange={(e) => setEditRecord({ ...editRecord, amount: e.target.value })}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditRecord(null)}>Cancel</Button>
                    <Button
                        onClick={handleEditSave}
                        variant="contained"
                        disabled={editSaving || !editRecord?.date || !editRecord?.fleet?.trim() || editRecord.amount === '' || isNaN(parseFloat(editRecord.amount))}
                    >
                        {editSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Reports;
