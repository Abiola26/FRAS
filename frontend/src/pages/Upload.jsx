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
} from '@mui/material';
import {
    CloudUpload,
    InsertDriveFile,
    Delete,
    ErrorOutline,
    CheckCircleOutline,
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
            } catch (error) {
                console.error("Error parsing file for preview", error);
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

    const handleUpload = async () => {
        if (files.length === 0 || validationError) return;

        setUploading(true);
        setProgress(0);

        const formData = new FormData();
        files.forEach(file => {
            formData.append('files', file);
        });

        try {
            await api.post('/files/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setProgress(percentCompleted);
                }
            });
            enqueueSnackbar('Upload successful!', { variant: 'success' });
            setFiles([]);
            setPreviewData([]);
            setPreviewColumns([]);
            setValidationError(null);
            setProgress(0);
        } catch (error) {
            console.error(error);
            enqueueSnackbar('Upload failed. ' + (error.response?.data?.detail || 'Please try again.'), { variant: 'error' });
        } finally {
            setUploading(false);
        }
    };

    return (
        <Box maxWidth="lg" mx="auto">
            <Typography variant="h4" sx={{ mb: 1, fontWeight: 800, color: '#1e293b' }}>
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
                    backgroundColor: dragActive ? 'rgba(37, 99, 235, 0.05)' : '#f8fafc',
                    border: '2px dashed',
                    borderColor: dragActive ? 'primary.main' : '#cbd5e1',
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
                    <CloudUpload sx={{ fontSize: 64, color: dragActive ? 'primary.main' : '#94a3b8', mb: 2 }} />
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
                                        sx={{ bgcolor: 'white' }}
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
                                    {index < files.length - 1 && <Box sx={{ borderBottom: '1px solid #f1f5f9' }} />}
                                </React.Fragment>
                            ))}
                        </List>

                        {/* Validation Feedback */}
                        {validationError ? (
                            <Alert severity="error" icon={<ErrorOutline />} sx={{ m: 2, borderRadius: 2 }}>
                                {validationError}
                            </Alert>
                        ) : previewData.length > 0 ? (
                            <Alert severity="success" icon={<CheckCircleOutline />} sx={{ m: 2, borderRadius: 2 }}>
                                File structure looks good! Ready to upload.
                            </Alert>
                        ) : null}

                        {/* Data Preview Section */}
                        {previewData.length > 0 && (
                            <Box sx={{ p: 2, bgcolor: '#f1f5f9', borderTop: '1px solid #e2e8f0' }}>
                                <Typography variant="subtitle2" gutterBottom color="textSecondary" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    Data Preview (Last added file)
                                </Typography>
                                <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 200, borderRadius: 2 }}>
                                    <Table size="small" stickyHeader>
                                        <TableHead>
                                            <TableRow>
                                                {previewColumns.map((col, idx) => (
                                                    <TableCell key={idx} sx={{ fontWeight: 700, bgcolor: '#e2e8f0', color: '#475569' }}>{col || `Col ${idx + 1}`}</TableCell>
                                                ))}
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {previewData.map((row, rIdx) => (
                                                <TableRow key={rIdx} sx={{ '&:nth-of-type(even)': { bgcolor: 'rgba(0,0,0,0.01)' } }}>
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
                            <Box sx={{ p: 2, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="caption" color="textSecondary">Uploading...</Typography>
                                    <Typography variant="caption" color="textSecondary">{progress}%</Typography>
                                </Box>
                                <LinearProgress variant="determinate" value={progress} sx={{ borderRadius: 4, height: 8 }} />
                            </Box>
                        )}

                        <Box sx={{ p: 2, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                            <Button
                                variant="contained"
                                size="large"
                                onClick={handleUpload}
                                disabled={uploading || files.length === 0 || !!validationError}
                                sx={{ textTransform: 'none', px: 4, borderRadius: 2 }}
                            >
                                {uploading ? 'Processing...' : 'Confirm & Upload'}
                            </Button>
                        </Box>
                    </Paper>
                </Box>
            )}
        </Box>
    );
};

export default Upload;
