import React, { useState } from 'react';
import {
    Box,
    TextField,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    MenuItem,
    Alert
} from '@mui/material';
import dayjs from 'dayjs';

// Utility functions for timezone handling
function toLocalInputString(isoString) {
    return isoString ? dayjs(isoString).format('YYYY-MM-DDTHH:mm') : '';
}
function toLocalISOStringWithOffset(localString) {
    return dayjs(localString).format('YYYY-MM-DDTHH:mm:ssZ');
}

const TaskForm = ({ onSubmit, onCancel, task }) => {
    const [formData, setFormData] = useState({
        task_name: task?.task_name || '',
        description: task?.description || '',
        priority: task?.priority || 'medium',
        start_time: task?.start_time ? toLocalInputString(task.start_time) : '',
        end_time: task?.end_time ? toLocalInputString(task.end_time) : '',
        status: task?.status || 'pending'
    });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            // Validation logic
            const start = dayjs(formData.start_time);
            const end = dayjs(formData.end_time);
            const now = dayjs();
            if (formData.status !== 'completed' && end.isBefore(now)) {
                setError('End time cannot be in the past if the task is not completed.');
                setLoading(false);
                return;
            }
            // Convert to ISO string with offset for backend
            const payload = {
                ...formData,
                start_time: toLocalISOStringWithOffset(formData.start_time),
                end_time: toLocalISOStringWithOffset(formData.end_time),
            };
            await onSubmit(payload);
            onCancel();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save task. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    return (

        <Dialog open={true} onClose={onCancel} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, fontFamily: "'Quicksand', Arial, sans-serif" } }}>
            <DialogTitle sx={{ fontWeight: 700, fontSize: '1.15rem', color: '#3fc8e0' }}>
                {task ? 'Edit Task' : 'Create New Task'}
            </DialogTitle>
            <form onSubmit={handleSubmit}>
                <DialogContent>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            required
                            fullWidth
                            label="Task Name"
                            name="task_name"
                            value={formData.task_name}
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
                            required
                            fullWidth
                            select
                            label="Priority"
                            name="priority"
                            value={formData.priority}
                            onChange={handleChange}
                            InputProps={{ sx: { borderRadius: 2, fontSize: '1.08rem' } }}
                        >
                            <MenuItem value="low">Low</MenuItem>
                            <MenuItem value="medium">Medium</MenuItem>
                            <MenuItem value="high">High</MenuItem>
                        </TextField>
                        <TextField
                            required
                            fullWidth
                            label="Start Time"
                            name="start_time"
                            type="datetime-local"
                            value={formData.start_time}
                            onChange={handleChange}
                            InputLabelProps={{ shrink: true }}
                            InputProps={{ sx: { borderRadius: 2, fontSize: '1.08rem' } }}
                        />
                        <TextField
                            required
                            fullWidth
                            label="End Time"
                            name="end_time"
                            type="datetime-local"
                            value={formData.end_time}
                            onChange={handleChange}
                            InputLabelProps={{ shrink: true }}
                            InputProps={{ sx: { borderRadius: 2, fontSize: '1.08rem' } }}
                        />
                        <TextField
                            required
                            fullWidth
                            select
                            label="Status"
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            InputProps={{ sx: { borderRadius: 2, fontSize: '1.08rem' } }}
                        >
                            <MenuItem value="pending">Pending</MenuItem>
                            <MenuItem value="in_progress">In Progress</MenuItem>
                            <MenuItem value="completed">Completed</MenuItem>
                            <MenuItem value="cancelled">Cancelled</MenuItem>
                        </TextField>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onCancel} sx={{ background: '#ede7f6', color: '#3fc8e0', borderRadius: 2, '&:hover': { background: '#d1c4e9' } }}>Cancel</Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={loading}
                        sx={{ background: '#3fc8e0', color: '#fff', borderRadius: 2, '&:hover': { background: '#2bb3c0' } }}
                    >
                        {loading ? 'Saving...' : (task ? 'Update' : 'Create')}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default TaskForm;
