import React, { useState } from 'react';
import {
    Box,
    TextField,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert
} from '@mui/material';
import dayjs from 'dayjs';

function toLocalInputString(isoString) {
    return isoString ? dayjs(isoString).format('YYYY-MM-DDTHH:mm') : '';
}
function toLocalISOStringWithOffset(localString) {
    return dayjs(localString).format('YYYY-MM-DDTHH:mm:ssZ');
}

const EventForm = ({ onSubmit, onCancel, event }) => {
    const [formData, setFormData] = useState({
        summary: event?.summary || '',
        description: event?.description || '',
        location: event?.location || '',
        start: event?.start?.dateTime ? toLocalInputString(event.start.dateTime) : '',
        end: event?.end?.dateTime ? toLocalInputString(event.end.dateTime) : '',
    });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const start = dayjs(formData.start);
            const end = dayjs(formData.end);
            const now = dayjs();
            if (end.isBefore(now)) {
                setError('End time cannot be in the past.');
                setLoading(false);
                return;
            }
            const payload = {
                summary: formData.summary,
                description: formData.description,
                location: formData.location,
                start: { dateTime: toLocalISOStringWithOffset(formData.start), timeZone: 'UTC' },
                end: { dateTime: toLocalISOStringWithOffset(formData.end), timeZone: 'UTC' },
            };
            await onSubmit(payload);
            onCancel();
        } catch (err) {
            setError('Unable to save event.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <Dialog open={true} onClose={onCancel} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, fontFamily: "'Quicksand', Arial, sans-serif" } }}>
            <DialogTitle sx={{ fontWeight: 700, fontSize: '1.15rem', color: '#3fc8e0' }}>{event ? 'Edit Event' : 'Create New Event'}</DialogTitle>
            <form onSubmit={handleSubmit}>
                <DialogContent>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            required
                            fullWidth
                            label="Event Name"
                            name="summary"
                            value={formData.summary}
                            onChange={handleChange}
                            InputProps={{ sx: { borderRadius: 2, fontSize: '1.08rem' } }}
                        />
                        <TextField
                            fullWidth
                            label="Description"
                            name="description"
                            multiline
                            rows={3}
                            value={formData.description}
                            onChange={handleChange}
                            InputProps={{ sx: { borderRadius: 2, fontSize: '1.08rem' } }}
                        />
                        <TextField
                            fullWidth
                            label="Location"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            InputProps={{ sx: { borderRadius: 2, fontSize: '1.08rem' } }}
                        />
                        <TextField
                            required
                            fullWidth
                            label="Start"
                            name="start"
                            type="datetime-local"
                            value={formData.start}
                            onChange={handleChange}
                            InputLabelProps={{ shrink: true }}
                            InputProps={{ sx: { borderRadius: 2, fontSize: '1.08rem' } }}
                        />
                        <TextField
                            required
                            fullWidth
                            label="End"
                            name="end"
                            type="datetime-local"
                            value={formData.end}
                            onChange={handleChange}
                            InputLabelProps={{ shrink: true }}
                            InputProps={{ sx: { borderRadius: 2, fontSize: '1.08rem' } }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onCancel} sx={{ background: '#ede7f6', color: '#3fc8e0', borderRadius: 2, '&:hover': { background: '#d1c4e9' } }}>Cancel</Button>
                    <Button type="submit" variant="contained" disabled={loading} sx={{ background: '#3fc8e0', color: '#fff', borderRadius: 2, '&:hover': { background: '#2bb3c0' } }}>
                        {loading ? 'Saving...' : (event ? 'Update' : 'Create')}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default EventForm;