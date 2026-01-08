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
    Chip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem
} from '@mui/material';
import { Delete, Edit } from '@mui/icons-material';
import api from '../services/api';
import { useSnackbar } from 'notistack';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [editRole, setEditRole] = useState('user');

    // Delete Confirmation State
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);

    const { enqueueSnackbar } = useSnackbar();

    const fetchUsers = async () => {
        try {
            const res = await api.get('/auth/users');
            setUsers(res.data);
        } catch (error) {
            console.error(error);
            enqueueSnackbar('Failed to fetch users', { variant: 'error' });
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleDelete = (id) => {
        setUserToDelete(id);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!userToDelete) return;
        try {
            await api.delete(`/auth/users/${userToDelete}`);
            enqueueSnackbar('User deleted', { variant: 'success' });
            fetchUsers();
            setDeleteDialogOpen(false);
            setUserToDelete(null);
        } catch (error) {
            enqueueSnackbar('Failed to delete user', { variant: 'error' });
        }
    };

    const handleEdit = (user) => {
        setSelectedUser(user);
        setEditRole(user.role);
        setOpenDialog(true);
    };

    const handleSave = async () => {
        try {
            await api.put(`/auth/users/${selectedUser.id}`, { role: editRole });
            enqueueSnackbar('User updated', { variant: 'success' });
            setOpenDialog(false);
            fetchUsers();
        } catch (error) {
            enqueueSnackbar('Failed to update user', { variant: 'error' });
        }
    };

    return (
        <Box>
            <Typography variant="h4" sx={{ mb: 4, fontWeight: 800 }}>User Management</Typography>
            <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Username</TableCell>
                                <TableCell>Account ID</TableCell>
                                <TableCell>Role</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.id} hover>
                                    <TableCell>{user.id}</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>{user.username}</TableCell>
                                    <TableCell sx={{ fontFamily: 'monospace' }}>{user.account_id || '-'}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={user.role}
                                            color={user.role === 'admin' ? 'primary' : 'default'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton onClick={() => handleEdit(user)} size="small" color="primary">
                                            <Edit fontSize="small" />
                                        </IconButton>
                                        <IconButton onClick={() => handleDelete(user.id)} size="small" color="error">
                                            <Delete fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
                <DialogTitle>Edit User Role</DialogTitle>
                <DialogContent sx={{ minWidth: 300, pt: 2 }}>
                    <TextField
                        select
                        label="Role"
                        fullWidth
                        value={editRole}
                        onChange={(e) => setEditRole(e.target.value)}
                        margin="dense"
                    >
                        <MenuItem value="user">User</MenuItem>
                        <MenuItem value="admin">Admin</MenuItem>
                    </TextField>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                    <Button onClick={handleSave} variant="contained">Save</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete this user? This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                    <Button onClick={confirmDelete} color="error" variant="contained">Delete User</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default UserManagement;
