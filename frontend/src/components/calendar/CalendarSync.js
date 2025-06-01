import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Button, Paper, Divider, Chip, Stack, CircularProgress } from '@mui/material';
import { Sync as SyncIcon, CloudDone as CloudDoneIcon, CloudOff as CloudOffIcon } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import api from '../../services/api';
import googleCalendarManager from '../../services/googleCalendarManager';
import outlookService from '../../services/outlookService';

const CalendarSync = () => {
    const [googleConnected, setGoogleConnected] = useState(false);
    const [outlookConnected, setOutlookConnected] = useState(false);
    const [googleSyncing, setGoogleSyncing] = useState(false);
    const [outlookSyncing, setOutlookSyncing] = useState(false);
    const [googleStatus, setGoogleStatus] = useState('Not connected');
    const [outlookStatus, setOutlookStatus] = useState('Not connected');
    const [googleSyncError, setGoogleSyncError] = useState('');
    const [outlookSyncError, setOutlookSyncError] = useState('');
    const [isGoogleConnecting, setIsGoogleConnecting] = useState(false);
    const [isOutlookConnecting, setIsOutlookConnecting] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState(null);
    const isSyncingRef = useRef(false);
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    useEffect(() => {
        // Check initial connection status
        checkGoogleConnection();
        
        // Start periodic connection checks
        googleCalendarManager.startConnectionCheck();

        // Set up automatic sync
        const syncInterval = setInterval(() => {
            if (googleConnected) {
                handleSyncGoogle();
            }
        }, 300000); // Sync every 5 minutes

        return () => {
            googleCalendarManager.stopConnectionCheck();
            clearInterval(syncInterval);
        };
    }, [googleConnected]);

    useEffect(() => {
        const checkOutlookConnection = async () => {
            try {
                const response = await outlookService.checkConnection();
                setOutlookConnected(response.connected);
                setOutlookStatus(response.connected ? 'Connected' : 'Not connected');
            } catch (err) {
                console.error('Error checking Outlook connection:', err);
            }
        };
        checkOutlookConnection();
    }, []);

    const checkGoogleConnection = async () => {
        const connected = await googleCalendarManager.checkConnection();
        setGoogleConnected(connected);
        setGoogleStatus(connected ? 'Connected' : 'Not connected');
        if (connected) {
            handleSyncGoogle();
        }
    };

    const handleConnectGoogle = async () => {
        try {
            if (outlookConnected) {
                // Disconnect Outlook first
                await handleDisconnectOutlook();
            }
            setIsGoogleConnecting(true);
            setGoogleSyncError('');
            await googleCalendarManager.connect();
            await checkGoogleConnection();
        } catch (error) {
            setGoogleSyncError(error.message || 'Failed to connect');
            setGoogleStatus('Connection failed');
        } finally {
            setIsGoogleConnecting(false);
        }
    };

    const handleDisconnectGoogle = async () => {
        try {
            setIsOutlookConnecting(true);
            setGoogleSyncError('');
            await googleCalendarManager.disconnect();
            setGoogleConnected(false);
            setGoogleStatus('Not connected');
            setLastSyncTime(null);
        } catch (error) {
            setGoogleSyncError(error.message || 'Failed to disconnect');
        } finally {
            setIsOutlookConnecting(false);
        }
    };

    const handleSyncGoogle = async () => {
        if (isSyncingRef.current) {
            return;
        }
        isSyncingRef.current = true;
        setGoogleSyncing(true);
        setGoogleSyncError('');
        try {
            // Pull events from Google Calendar into your DB
            await api.post('/calendarsync/events/pull/');
            // Push local events to Google Calendar
            await api.post('/calendarsync/events/push/');
            // Pull Google Tasks into your DB
            await googleCalendarManager.pullGoogleTasks();
            // Push local tasks to Google Tasks
            await googleCalendarManager.pushGoogleTasks();
            // Now fetch the latest events for display
            await api.post('/calendarsync/google/sync/');
            setLastSyncTime(new Date());
            setGoogleStatus(`Last synced at ${new Date().toLocaleTimeString()}`);
        } catch (error) {
            setGoogleSyncError(error.response?.data?.error || error.message || 'Sync failed');
        } finally {
            setGoogleSyncing(false);
            isSyncingRef.current = false;
        }
    };

    const handleConnectOutlook = async () => {
        try {
            if (googleConnected) {
                // Disconnect Google first
                await handleDisconnectGoogle();
            }
            setIsOutlookConnecting(true);
            setOutlookSyncError('');
            const response = await outlookService.startAuth();
            window.location.href = response.auth_url;
        } catch (error) {
            setOutlookSyncError(error.message || 'Failed to connect');
            setOutlookStatus('Connection failed');
        } finally {
            setIsOutlookConnecting(false);
        }
    };

    const handleDisconnectOutlook = async () => {
        try {
            setIsOutlookConnecting(true);
            setOutlookSyncError('');
            await outlookService.disconnect();
        setOutlookConnected(false);
        setOutlookStatus('Not connected');
            setLastSyncTime(null);
        } catch (error) {
            setOutlookSyncError(error.message || 'Failed to disconnect');
        } finally {
            setIsOutlookConnecting(false);
        }
    };

    const handleSyncOutlook = async () => {
        console.log('[LOG] handleSyncOutlook called');
        setOutlookSyncing(true);
        setOutlookSyncError('');
        try {
            await outlookService.sync();
            setLastSyncTime(new Date());
            setOutlookStatus(`Last synced at ${new Date().toLocaleTimeString()}`);
        } catch (error) {
            setOutlookSyncError(error.response?.data?.error || error.message || 'Sync failed');
        } finally {
            setOutlookSyncing(false);
        }
    };

    // Auto sync on tab open for whichever calendar is connected
    useEffect(() => {
        console.log('[LOG] useEffect [googleConnected, outlookConnected] triggered', { googleConnected, outlookConnected });
        if (googleConnected) {
            handleSyncGoogle();
        } else if (outlookConnected) {
            handleSyncOutlook();
        }
        // eslint-disable-next-line
    }, [googleConnected, outlookConnected]);

    return (
        <Box maxWidth={600} mx="auto">
            <Typography variant="h4" gutterBottom sx={{ fontFamily: 'Poppins,Roboto', color: isDark ? '#3fc8e0' : '#007AFF', fontWeight: 700 }}>
                Calendar Sync
            </Typography>
            <Typography variant="body1" gutterBottom sx={{ color: isDark ? '#e3e6f3' : '#23272f', fontFamily: 'Roboto' }}>
                Connect Google Calendar or Outlook to sync your tasks and events between this app and your calendar.
            </Typography>
            <Divider sx={{ my: 3, borderColor: isDark ? '#23263a' : undefined }} />
            
            {/* Google Calendar Section */}
            <Paper sx={{
                p: 3, mb: 3,
                borderRadius: 3,
                boxShadow: isDark ? '0 2px 16px #3fc8e022' : '0 2px 16px #007aff11',
                background: isDark
                    ? 'linear-gradient(120deg, #181c2a 0%, #23263a 100%)'
                    : 'linear-gradient(120deg, #f2f2f2 0%, #e9f0ff 100%)'
            }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                    <img src="https://fonts.gstatic.com/s/i/productlogos/googleg/v6/24px.svg" alt="Google" width={32} height={32} />
                    <Typography variant="h6" sx={{ fontFamily: 'Poppins,Roboto', color: '#007AFF', fontWeight: 600 }}>Google Calendar</Typography>
                    <Chip 
                        label={googleStatus} 
                        color={googleConnected ? 'success' : 'default'} 
                        icon={googleConnected ? <CloudDoneIcon /> : <CloudOffIcon />} 
                        sx={{ fontWeight: 500, fontFamily: 'Roboto' }}
                    />
                </Stack>
                <Box mt={2}>
                    {googleConnected ? (
                        <>
                            <Button 
                                variant="outlined" 
                                color="error" 
                                onClick={handleDisconnectGoogle} 
                                sx={{
                                    mr: 2,
                                    borderRadius: 2,
                                    fontWeight: 600,
                                    fontFamily: 'Roboto',
                                    boxShadow: '0 2px 8px #ff950022',
                                    '&:hover': { background: '#ffe5d0' }
                                }}
                                disabled={isOutlookConnecting}
                            >
                                {isOutlookConnecting ? 'Disconnecting...' : 'Disconnect'}
                            </Button>
                            <Button 
                                variant="contained" 
                                color="primary" 
                                startIcon={<SyncIcon />} 
                                onClick={handleSyncGoogle} 
                                disabled={googleSyncing}
                                sx={{
                                    background: '#007AFF',
                                    borderRadius: 2,
                                    fontWeight: 600,
                                    fontFamily: 'Roboto',
                                    boxShadow: '0 2px 8px #007aff22',
                                    '&:hover': { background: '#005ecb' }
                                }}
                            >
                                {googleSyncing ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
                                {googleSyncing ? 'Syncing...' : 'Sync Now'}
                            </Button>
                        </>
                    ) : (
                        <Button 
                            variant="contained" 
                            color="primary" 
                            onClick={handleConnectGoogle}
                            disabled={isGoogleConnecting}
                            sx={{
                                background: '#007AFF',
                                borderRadius: 2,
                                fontWeight: 600,
                                fontFamily: 'Roboto',
                                boxShadow: '0 2px 8px #007aff22',
                                '&:hover': { background: '#005ecb' }
                            }}
                        >
                            {isGoogleConnecting ? 'Connecting...' : 'Connect Google Calendar'}
                        </Button>
                    )}
                </Box>
                {googleSyncError && (
                    <Typography color="error" mt={2}>
                        {googleSyncError}
                    </Typography>
                )}
            </Paper>

            {/* Outlook Calendar Section */}
            <Paper sx={{
                p: 3,
                borderRadius: 3,
                boxShadow: isDark ? '0 2px 16px #3fc8e022' : '0 2px 16px #007aff11',
                background: isDark
                    ? 'linear-gradient(120deg, #181c2a 0%, #23263a 100%)'
                    : 'linear-gradient(120deg, #f2f2f2 0%, #e9f0ff 100%)'
            }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                    <img src="https://upload.wikimedia.org/wikipedia/commons/d/df/Microsoft_Office_Outlook_%282018%E2%80%93present%29.svg" alt="Outlook" width={32} height={32} />
                    <Typography variant="h6" sx={{ fontFamily: 'Poppins,Roboto', color: '#007AFF', fontWeight: 600 }}>Outlook Calendar</Typography>
                    <Chip 
                        label={outlookStatus} 
                        color={outlookConnected ? 'success' : 'default'} 
                        icon={outlookConnected ? <CloudDoneIcon /> : <CloudOffIcon />} 
                        sx={{ fontWeight: 500, fontFamily: 'Roboto' }}
                    />
                </Stack>
                <Box mt={2}>
                    {outlookConnected ? (
                        <>
                            <Button 
                                variant="outlined" 
                                color="error" 
                                onClick={handleDisconnectOutlook} 
                                sx={{
                                    mr: 2,
                                    borderRadius: 2,
                                    fontWeight: 600,
                                    fontFamily: 'Roboto',
                                    boxShadow: '0 2px 8px #ff950022',
                                    '&:hover': { background: '#ffe5d0' }
                                }}
                                disabled={isOutlookConnecting}
                            >
                                {isOutlookConnecting ? 'Disconnecting...' : 'Disconnect'}
                            </Button>
                            <Button 
                                variant="contained" 
                                color="primary" 
                                startIcon={<SyncIcon />} 
                                onClick={handleSyncOutlook} 
                                disabled={outlookSyncing}
                                sx={{
                                    background: '#007AFF',
                                    borderRadius: 2,
                                    fontWeight: 600,
                                    fontFamily: 'Roboto',
                                    boxShadow: '0 2px 8px #007aff22',
                                    '&:hover': { background: '#005ecb' }
                                }}
                            >
                                {outlookSyncing ? 'Syncing...' : 'Sync Now'}
                            </Button>
                        </>
                    ) : (
                        <Button 
                            variant="contained" 
                            color="primary" 
                            onClick={handleConnectOutlook}
                            disabled={isOutlookConnecting}
                            sx={{
                                background: '#007AFF',
                                borderRadius: 2,
                                fontWeight: 600,
                                fontFamily: 'Roboto',
                                boxShadow: '0 2px 8px #007aff22',
                                '&:hover': { background: '#005ecb' }
                            }}
                        >
                            {isOutlookConnecting ? 'Connecting...' : 'Connect Outlook Calendar'}
                        </Button>
                    )}
                </Box>
            </Paper>
        </Box>
    );
};

export default CalendarSync;
