
import React from 'react';
import { Box, Grid, Paper, Skeleton, Stack } from '@mui/material';

export const PageSkeleton = () => {
    return (
        <Box>
            <Box sx={{ mb: 4 }}>
                <Skeleton width="30%" height={50} />
                <Skeleton width="50%" height={24} />
            </Box>

            <Grid container spacing={3}>
                {[1, 2, 3, 4].map((i) => (
                    <Grid item xs={12} sm={6} md={3} key={i}>
                        <Paper sx={{ p: 3, borderRadius: 4 }}>
                            <Stack direction="row" justifyContent="space-between" spacing={2}>
                                <Skeleton width="60%" />
                                <Skeleton variant="circular" width={40} height={40} />
                            </Stack>
                            <Skeleton width="80%" height={60} sx={{ mt: 2 }} />
                            <Skeleton width="40%" sx={{ mt: 1 }} />
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            <Grid container spacing={3} sx={{ mt: 2 }}>
                <Grid item xs={12} md={8}>
                    <Skeleton width="40%" height={32} sx={{ mb: 2 }} />
                    <Paper sx={{ p: 2, borderRadius: 3 }}>
                        {[1, 2, 3, 4, 5].map((i) => (
                            <Box key={i} sx={{ py: 1, display: 'flex', gap: 2 }}>
                                <Skeleton variant="rounded" width={40} height={40} />
                                <Box sx={{ flexGrow: 1 }}>
                                    <Skeleton width="40%" />
                                    <Skeleton width="90%" />
                                </Box>
                                <Skeleton width={60} />
                            </Box>
                        ))}
                    </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Skeleton width="40%" height={32} sx={{ mb: 2 }} />
                    <Stack spacing={2}>
                        {[1, 2, 3].map((i) => (
                            <Paper key={i} sx={{ p: 2, borderRadius: 3 }}>
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <Skeleton variant="rounded" width={32} height={32} />
                                    <Box sx={{ flexGrow: 1 }}>
                                        <Skeleton width="60%" />
                                        <Skeleton width="40%" />
                                    </Box>
                                </Box>
                            </Paper>
                        ))}
                    </Stack>
                </Grid>
            </Grid>
        </Box>
    );
};
