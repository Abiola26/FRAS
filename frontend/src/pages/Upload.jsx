import React, { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import {
    Box,
    Typography,
    Paper,
    Button,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    IconButton,
    LinearProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Chip,
} from '@mui/material';
import {
    CloudUpload,
    InsertDriveFile,
    Delete,
    ErrorOutline,
    CheckCircleOutline,
    WarningAmber,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import api from '../services/api';

const Upload = () => {
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [dragActive, setDragActive] = useState(false);
    const [previewData, setPreviewData] = useState([]);
    const [previewColumns, setPreviewColumns] = useState([]);
    const [validationError, setValidationError] = useState(null);

    const [checking, setChecking] = useState(false);
    const [dupResult, setDupResult] = useState(null);
    const [dupDialogOpen, setDupDialogOpen] = useState(false);

    const { enqueueSnackbar } = useSnackbar();

    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFiles(e.dataTransfer.files);
        }
    }, []);

    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFiles(e.target.files);
        }
    };

    const handleFiles = (newFiles) => {
        const validFiles = Array.from(newFiles).filter(file =>
            file.type === 'text/csv' ||
            file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
            file.name.endsWith('.csv') ||
            file.name.endsWith('.xlsx')
        );

        if (validFiles.length !== newFiles.length) {
            enqueueSnackbar('Some files were ignored (only CSV/Excel allowed)', { variant: 'warning' });
        }

        if (validFiles.length > 0) {
            setFiles(prev => [...prev, ...validFiles]);
            generatePreview(validFiles[validFiles.length - 1]);
        }
    };

    const generatePreview = (file) => {
        setValidationError(null);
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

                if (jsonData.length > 0) {
                    const headers = jsonData[0].map(h => String(h || '').trim().toLowerCase());
                    const required = ['date', 'fleet', 'amount'];
                    const missing = required.filter(req => !headers.includes(req));

                    if (missing.length > 0) {
                        setValidationError(`Missing required columns: ${missing.join(', ')}. Please check your file format.`);
                    }

                    setPreviewColumns(jsonData[0]);
                    setPreviewData(jsonData.slice(1, 6));
                }
            } catch {
                setValidationError("Failed to parse file. Please ensure it is a valid CSV/Excel.");
            }
        };
        reader.readAsBinaryString(file);
    };

    const removeFile = (index) => {
        setFiles(prev => {
            const newFiles = prev.filter((_, i) => i !== index);
            if (newFiles.length === 0) {
                setPreviewData([]);
                setPreviewColumns([]);
                setValidationError(null);
            } else if (index === prev.length - 1) {
                generatePreview(newFiles[newFiles.length - 1]);
            }
            return newFiles;
        });
    };

    const handleCheckDuplicates = async () => {
        if (files.length === 0 || validationError) return;

        setChecking(true);
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));

        try {
            const response = await api.post('/files/check-duplicates', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            const data = response.data;
            setDupResult(data);
            setDupDialogOpen(true);
        } catch (error) {
            enqueueSnackbar('Duplicate check failed. ' + (error.response?.data?.detail || 'Please try again.'), { variant: 'error' });
        } finally {
            setChecking(false);
        }
    };

    const handleConfirmUpload = async () => {
        setDupDialogOpen(false);
        setUploading(true);
        setProgress(0);

        const formData = new FormData();
        files.forEach(file => formData.append('files', file));

        try {
            const response = await api.post('/files/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setProgress(percentCompleted);
                }
            });

            const { stats } = response.data;

            if (stats.errors && stats.errors.length > 0) {
                enqueueSnackbar(`Upload errors: ${stats.errors.join('; ')}`, { variant: 'error' });
            } else if (stats.records_imported === 0) {
                enqueueSnackbar(
                    `No new records imported. ${stats.duplicates_skipped} duplicate(s) skipped.`,
                    { variant: 'warning' }
                );
            } else {
                const msg = `Uploaded ${stats.records_imported} record(s).` +
                    (stats.duplicates_skipped > 0 ? ` ${stats.duplicates_skipped} duplicate(s) skipped.` : '');
                enqueueSnackbar(msg, { variant: 'success' });
            }

            setFiles([]);
            setPreviewData([]);
            setPreviewColumns([]);
            setValidationError(null);
            setProgress(0);
            setDupResult(null);
        } catch (error) {
            enqueueSnackbar('Upload failed. ' + (error.response?.data?.detail || 'Please try again.'), { variant: 'error' });
        } finally {
            setUploading(false);
        }
    };

    const handleCancelUpload = () => {
        setDupDialogOpen(false);
        setDupResult(null);
        enqueueSnackbar('Upload cancelled.', { variant: 'info' });
    };

    const formatAmount = (val) => {
        const num = Number(val);
        return isNaN(num) ? val : num.toLocaleString();
    };

    return (
        <Box maxWidth="lg" mx="auto">
            <Typography variant="h4" sx={{ mb: 1, fontWeight: 800, color: 'text.primary' }}>
                Upload Data
            </Typography>
            <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
                Upload your fleet data files (CSV or Excel) for processing. Ensure columns: <b>Date, Fleet, Amount</b> exist.
            </Typography>

            <Paper
                variant="outlined"
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                sx={{
                    p: 6,
                    textAlign: 'center',
                    backgroundColor: dragActive ? 'rgba(37, 99, 235, 0.05)' : 'action.hover',
                    border: '2px dashed',
                    borderColor: dragActive ? 'primary.main' : 'divider',
                    borderRadius: 4,
                    transition: 'all 0.2s ease-in-out',
                    cursor: 'pointer',
                    '&:hover': {
                        borderColor: 'primary.main',
                        backgroundColor: 'rgba(37, 99, 235, 0.02)',
                    }
                }}
            >
                <input
                    type="file"
                    multiple
                    accept=".csv, .xlsx"
                    onChange={handleChange}
                    style={{ display: 'none' }}
                    id="file-upload"
                />
                <label htmlFor="file-upload" style={{ width: '100%', height: '100%', cursor: 'pointer' }}>
                    <CloudUpload sx={{ fontSize: 64, color: dragActive ? 'primary.main' : 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" gutterBottom color="textPrimary" fontWeight={600}>
                        Drag and drop files here, or click to browse
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        Supports multiple CSV or Excel files
                    </Typography>
                </label>
            </Paper>

            {files.length > 0 && (
                <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" gutterBottom fontWeight={600}>
                        Selected Files ({files.length})
                    </Typography>
                    <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden', mb: 4 }}>
                        <List disablePadding>
                            {files.map((file, index) => (
                                <React.Fragment key={index}>
                                    <ListItem
                                        secondaryAction={
                                            !uploading && (
                                                <IconButton edge="end" aria-label="delete" onClick={() => removeFile(index)}>
                                                    <Delete color="action" />
                                                </IconButton>
                                            )
                                        }
                                        sx={{ bgcolor: 'background.paper' }}
                                    >
                                        <ListItemIcon>
                                            <InsertDriveFile color="primary" />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={file.name}
                                            secondary={`${(file.size / 1024).toFixed(1)} KB`}
                                            primaryTypographyProps={{ fontWeight: 500 }}
                                        />
                                    </ListItem>
                                    {index < files.length - 1 && <Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }} />}
                                </React.Fragment>
                            ))}
                        </List>

                        {validationError ? (
                            <Alert severity="error" icon={<ErrorOutline />} sx={{ m: 2, borderRadius: 2 }}>
                                {validationError}
                            </Alert>
                        ) : previewData.length > 0 ? (
                            <Alert severity="success" icon={<CheckCircleOutline />} sx={{ m: 2, borderRadius: 2 }}>
                                File structure looks good! Ready to check for duplicates.
                            </Alert>
                        ) : null}

                        {previewData.length > 0 && (
                            <Box sx={{ p: 2, bgcolor: 'action.hover', borderTop: '1px solid', borderColor: 'divider' }}>
                                <Typography variant="subtitle2" gutterBottom color="textSecondary" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    Data Preview (Last added file)
                                </Typography>
                                <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 200, borderRadius: 2 }}>
                                    <Table size="small" stickyHeader>
                                        <TableHead>
                                            <TableRow>
                                                {previewColumns.map((col, idx) => (
                                                    <TableCell key={idx} sx={{ fontWeight: 700, bgcolor: 'action.hover', color: 'text.secondary' }}>{col || `Col ${idx + 1}`}</TableCell>
                                                ))}
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {previewData.map((row, rIdx) => (
                                                <TableRow key={rIdx} sx={{ '&:nth-of-type(even)': { bgcolor: 'action.hover' } }}>
                                                    {Array.isArray(row) ? row.map((cell, cIdx) => (
                                                        <TableCell key={cIdx}>{String(cell || '')}</TableCell>
                                                    )) : <TableCell colSpan={previewColumns.length}>Invalid Row Data</TableCell>}
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Box>
                        )}

                        {uploading && (
                            <Box sx={{ p: 2, bgcolor: 'action.hover', borderTop: '1px solid', borderColor: 'divider' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="caption" color="textSecondary">Uploading...</Typography>
                                    <Typography variant="caption" color="textSecondary">{progress}%</Typography>
                                </Box>
                                <LinearProgress variant="determinate" value={progress} sx={{ borderRadius: 4, height: 8 }} />
                            </Box>
                        )}

                        <Box sx={{ p: 2, bgcolor: 'action.hover', borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                            <Button
                                variant="contained"
                                size="large"
                                onClick={handleCheckDuplicates}
                                disabled={checking || uploading || files.length === 0 || !!validationError}
                                sx={{ textTransform: 'none', px: 4, borderRadius: 2 }}
                            >
                                {checking ? 'Checking...' : 'Check for Duplicates'}
                            </Button>
                        </Box>
                    </Paper>
                </Box>
            )}

            <Dialog
                open={dupDialogOpen}
                onClose={handleCancelUpload}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle sx={{ fontWeight: 700 }}>
                    Duplicate Review
                </DialogTitle>
                <DialogContent dividers>
                    {dupResult && (
                        <>
                            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                                <Chip
                                    label={`Total Records: ${dupResult.total_records}`}
                                    color="default"
                                    variant="outlined"
                                />
                                <Chip
                                    label={`New Records: ${dupResult.new_count}`}
                                    color="success"
                                    variant="outlined"
                                />
                                <Chip
                                    label={`Duplicates: ${dupResult.duplicates_count}`}
                                    color={dupResult.duplicates_count > 0 ? 'warning' : 'default'}
                                    variant="outlined"
                                />
                            </Box>

                            {dupResult.errors && dupResult.errors.length > 0 && (
                                <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                                    {dupResult.errors.join('; ')}
                                </Alert>
                            )}

                            {dupResult.duplicates_count === 0 ? (
                                <Alert severity="success" icon={<CheckCircleOutline />} sx={{ borderRadius: 2 }}>
                                    No duplicates found. All {dupResult.new_count} record(s) are new.
                                </Alert>
                            ) : (
                                <>
                                    <Alert severity="warning" icon={<WarningAmber />} sx={{ mb: 2, borderRadius: 2 }}>
                                        {dupResult.duplicates_count} duplicate record(s) found. They will be skipped during upload.
                                    </Alert>
                                    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, maxHeight: 400 }}>
                                        <Table size="small" stickyHeader>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 700 }}>Commuter Name</TableCell>
                                                    <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                                                    <TableCell sx={{ fontWeight: 700 }}>Amount</TableCell>
                                                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {dupResult.duplicates.map((row, idx) => (
                                                    <TableRow key={idx} sx={{ '&:nth-of-type(even)': { bgcolor: 'action.hover' } }}>
                                                        <TableCell>{row.commuter_name || '-'}</TableCell>
                                                        <TableCell>{row.date}</TableCell>
                                                        <TableCell>{formatAmount(row.amount)}</TableCell>
                                                        <TableCell>
                                                            <Chip label="Duplicate" color="warning" size="small" variant="outlined" />
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </>
                            )}
                        </>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button
                        onClick={handleCancelUpload}
                        sx={{ textTransform: 'none' }}
                    >
                        Cancel Upload
                    </Button>
                    <Button
                        onClick={handleConfirmUpload}
                        variant="contained"
                        disabled={!dupResult || dupResult.new_count === 0}
                        sx={{ textTransform: 'none', borderRadius: 2 }}
                    >
                        Proceed with Upload ({dupResult?.new_count || 0} new record(s))
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Upload;
