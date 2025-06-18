import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    CircularProgress,
    Alert,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Divider,
    Chip
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { eventsAPI } from '../../services/api';
import dayjs from 'dayjs';
import EventForm from './EventForm';

const EventList = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const theme = useTheme();

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const response = await eventsAPI.getEvents();
            setEvents(response.data);
            setError(null);
        } catch (err) {
            setError('Unable to load events list.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const handleCreateEvent = async (eventData) => {
        try {
            await eventsAPI.createEvent(eventData);
            setShowForm(false);
            await fetchEvents();
        } catch (err) {
            throw err;
        }
    };

    const handleUpdateEvent = async (eventId, eventData) => {
        try {
            await eventsAPI.updateEvent(eventId, eventData);
            setSelectedEvent(null);
            await fetchEvents();
        } catch (err) {
            throw err;
        }
    };

    const handleDeleteEvent = async (eventId) => {
        try {
            await eventsAPI.deleteEvent(eventId);
            await fetchEvents();
        } catch (err) {
            setError('Unable to delete event.');
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box p={3} sx={{
            maxWidth: 700,
            margin: '0 auto',
            background: theme.palette.background.paper,
            color: theme.palette.text.primary,
            borderRadius: 3,
            boxShadow: theme.palette.mode === 'dark'
                ? '0 2px 16px rgba(60,72,100,0.18)'
                : '0 2px 16px rgba(60,72,100,0.08)',
            fontFamily: "'Quicksand', Arial, sans-serif",
            transition: 'background 0.3s, color 0.3s'
        }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5" fontWeight={700}>Events</Typography>
                <Button
                    variant="contained"
                    sx={{
                        borderRadius: 2,
                        fontWeight: 700,
                        background: '#3fc8e0',
                        color: '#fff',
                        fontSize: '1.08rem',
                        px: 3,
                        py: 1.5,
                        boxShadow: '0 2px 8px 0 #3fc8e022',
                        '&:hover': { background: '#2bb3c0' }
                    }}
                    onClick={() => setShowForm(true)}
                    startIcon={<i className="fa fa-plus" style={{ fontSize: 18 }} />}
                >
                    Add New Event
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {showForm && (
                <EventForm
                    onSubmit={handleCreateEvent}
                    onCancel={() => setShowForm(false)}
                />
            )}

            {selectedEvent && (
                <EventForm
                    event={selectedEvent}
                    onSubmit={(data) => handleUpdateEvent(selectedEvent.id, data)}
                    onCancel={() => setSelectedEvent(null)}
                />
            )}

            <List>
                {events.length === 0 && !loading && (
                    <Box sx={{ textAlign: 'center', mt: 4 }}>
                        <img src="/empty-event.svg" alt="" style={{ width: 64, opacity: 0.7 }} />
                        <Typography variant="body1" sx={{ color: '#b0b0b0', mt: 2, fontWeight: 500 }}>
                            No events yet. <br />Create your first event!
                        </Typography>
                    </Box>
                )}
                {events.map(event => (
                    <React.Fragment key={event.id}>
                        <ListItem alignItems="flex-start" sx={{
                            borderRadius: 2,
                            mb: 1,
                            boxShadow: '0 1px 4px 0 #3fc8e011',
                            bgcolor: theme.palette.mode === 'dark' ? '#23263a' : '#fafdff',
                            color: theme.palette.text.primary,
                            transition: 'background 0.3s, color 0.3s'
                        }}>
                            <ListItemText
                                primary={
                                    <Typography sx={{ fontWeight: 600, fontSize: '1.08rem', color: '#3fc8e0' }}>
                                        {event.title}
                                    </Typography>
                                }
                                secondary={<>
                                    <Typography component="span" variant="body2" color="text.primary">{event.description}</Typography><br/>
                                    <Typography component="span" variant="caption" color="text.secondary">
                                        {event.start?.dateTime ? dayjs(event.start.dateTime).format('YYYY-MM-DD HH:mm') : ''} - {event.end?.dateTime ? dayjs(event.end.dateTime).format('YYYY-MM-DD HH:mm') : ''}
                                    </Typography>
                                    {event.location && (
                                        <><br/><Typography component="span" variant="caption" color="text.secondary">Location: {event.location}</Typography></>
                                    )}
                                </>}
                            />
                            {event.external_provider && <Chip label={event.external_provider} size="small" sx={{ ml: 1, background: '#e0f7fa', color: '#3fc8e0', fontWeight: 600 }} />}
                            <ListItemSecondaryAction>
                                <IconButton edge="end" color="primary" onClick={() => setSelectedEvent(event)} sx={{ color: '#3fc8e0' }}>
                                    <i className="fa fa-edit" />
                                </IconButton>
                                <IconButton edge="end" color="error" onClick={() => handleDeleteEvent(event.id)} sx={{ color: '#e53935' }}>
                                    <i className="fa fa-trash" />
                                </IconButton>
                            </ListItemSecondaryAction>
                        </ListItem>
                        <Divider />
                    </React.Fragment>
                ))}
            </List>
        </Box>
    );
};

export default EventList;