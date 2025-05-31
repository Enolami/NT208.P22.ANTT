import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    CircularProgress,
    Alert,
    Paper,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Chip
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    Restore as RestoreIcon
} from '@mui/icons-material';
import TaskForm from './TaskForm';
import taskService from '../../services/taskService';

const TaskList = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);

    const fetchTasks = async () => {
        try {
            setLoading(true);
            const response = await taskService.getAllTasks();
            
            // Ensure we have an array of tasks
            const tasksArray = Array.isArray(response) ? response : [];
            
            setTasks(tasksArray);
            setError(null);
        } catch (err) {
            console.error('Error fetching tasks:', err);
            setError(err.response?.data?.message || 'Failed to fetch tasks. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    const handleCreateTask = async (taskData) => {
        try {
            const response = await taskService.createTask(taskData);
            setShowForm(false);
            await fetchTasks(); // Refresh the task list
        } catch (err) {
            console.error('Error creating task:', err);
            throw err; // Let the form handle the error
        }
    };

    const handleUpdateTask = async (taskId, taskData) => {
        try {
            const response = await taskService.updateTask(taskId, taskData);
            setSelectedTask(null);
            await fetchTasks();
        } catch (err) {
            console.error('Error updating task:', err);
            throw err;
        }
    };

    const handleDeleteTask = async (taskId) => {
        try {
            await taskService.deleteTask(taskId);
            await fetchTasks();
        } catch (err) {
            console.error('Error deleting task:', err);
            setError('Failed to delete task. Please try again.');
        }
    };

    const handleCompleteTask = async (taskId) => {
        try {
            await taskService.completeTask(taskId);
            await fetchTasks();
        } catch (err) {
            console.error('Error completing task:', err);
            setError('Failed to complete task. Please try again.');
        }
    };

    const handleCancelTask = async (taskId) => {
        try {
            await taskService.cancelTask(taskId);
            await fetchTasks();
        } catch (err) {
            setError('Failed to cancel task. Please try again.');
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high':
                return 'error';
            case 'medium':
                return 'warning';
            case 'low':
                return 'success';
            default:
                return 'default';
        }
    };

    // Helper for priority background color
    const getPriorityBg = (priority) => {
        if (priority === 'high') return '#ffd6d6'; 
        if (priority === 'medium') return '#fffbe6'; 
        return '#fff'; // low
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'completed': return 'Completed';
            case 'cancelled': return 'Cancelled';
            case 'pending': return 'Pending';
            case 'in_progress': return 'In Progress';
            default: return status;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'success';
            case 'cancelled': return 'default';
            case 'pending': return 'primary';
            case 'in_progress': return 'info';
            default: return 'default';
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
            background: '#fff',
            borderRadius: 3,
            boxShadow: '0 2px 16px rgba(60,72,100,0.08)',
            fontFamily: "'Quicksand', Arial, sans-serif"
        }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>

                <Typography variant="h5" fontWeight={700}>Tasks</Typography>
                <Button
                    variant="contained"
                    sx={{
                        borderRadius: 2,
                        fontWeight: 700,
                        background: '#ffb300',
                        color: '#fff',
                        fontSize: '1.08rem',
                        px: 3,
                        py: 1.5,
                        boxShadow: '0 2px 8px 0 #ffb30022',
                        '&:hover': { background: '#ffa000' }
                    }}
                    onClick={() => setShowForm(true)}
                    startIcon={<i className="fa fa-plus" style={{ fontSize: 18 }} />}
                >
                    Add New Task
                </Button>

            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {showForm && (
                <TaskForm
                    onSubmit={handleCreateTask}
                    onCancel={() => setShowForm(false)}
                />
            )}

            {selectedTask && (
                <TaskForm
                    task={selectedTask}
                    onSubmit={(data) => handleUpdateTask(selectedTask.id, data)}
                    onCancel={() => setSelectedTask(null)}
                />
            )}

            <Paper sx={{ boxShadow: '0 2px 8px 0 #3fc8e022' }}>
                <List>
                    {tasks.length === 0 ? (
                        <Box sx={{ textAlign: 'center', mt: 4 }}>
                            <img src="/empty-task.svg" alt="" style={{ width: 64, opacity: 0.7 }} />
                            <Typography variant="body1" sx={{ color: '#b0b0b0', mt: 2, fontWeight: 500 }}>
                                You have no tasks yet. <br />Create your first task!
                            </Typography>
                        </Box>
                    ) : (
                        tasks.map((task) => (
                            <ListItem
                                key={task.id}
                                divider
                                sx={{
                                    bgcolor: getPriorityBg(task.priority),
                                    borderRadius: 2,
                                    mb: 1,
                                    boxShadow: '0 1px 4px 0 #3fc8e011'
                                }}
                            >
                                <ListItemText
                                    primary={
                                        <Box display="flex" alignItems="center" gap={1}>
                                            {task.task_name}
                                            <Chip
                                                label={task.priority}
                                                size="small"
                                                color={getPriorityColor(task.priority)}
                                                sx={{
                                                    fontWeight: 600,
                                                    fontSize: '0.95rem',
                                                    borderRadius: 2,
                                                    px: 1.5,
                                                    background: task.priority === 'high' ? '#ffd6d6' : task.priority === 'medium' ? '#fffbe6' : '#e8f5e9',
                                                    color: task.priority === 'high' ? '#e53935' : task.priority === 'medium' ? '#fbc02d' : '#388e3c'
                                                }}
                                            />
                                            <Chip
                                                label={getStatusLabel(task.status)}
                                                size="small"
                                                color={getStatusColor(task.status)}
                                                sx={{
                                                    fontWeight: 600,
                                                    fontSize: '0.95rem',
                                                    borderRadius: 2,
                                                    px: 1.5
                                                }}
                                            />
                                        </Box>
                                    }
                                    secondary={
                                        <>
                                            <Typography variant="body2" color="textSecondary">
                                                {task.description}
                                            </Typography>
                                            <Typography variant="caption" color="textSecondary">
                                                {new Date(task.start_time).toLocaleString()} - {new Date(task.end_time).toLocaleString()}
                                            </Typography>
                                        </>
                                    }
                                />
                                <ListItemSecondaryAction>
                                    <IconButton
                                        edge="end"
                                        onClick={() => setSelectedTask(task)}
                                        sx={{ mr: 1, color: '#3fc8e0' }}
                                    >
                                        <i className="fa fa-edit" />
                                    </IconButton>
                                    <IconButton
                                        edge="end"
                                        onClick={() => handleDeleteTask(task.id)}
                                        sx={{ mr: 1, color: '#e53935' }}
                                    >
                                        <i className="fa fa-trash" />
                                    </IconButton>
                                    {task.status === 'completed' && (
                                        <IconButton
                                            edge="end"
                                            onClick={() => handleUpdateTask(task.id, { ...task, status: 'pending' })}
                                            sx={{ mr: 1, color: '#bdbdbd' }}
                                        >
                                            <CheckCircleIcon color="disabled" />
                                            <Typography variant="caption" ml={0.5}>Reset to Pending</Typography>
                                        </IconButton>
                                    )}
                                    {(task.status === 'pending' || task.status === 'in_progress') && (
                                        <>
                                            <IconButton
                                                edge="end"
                                                onClick={() => handleCompleteTask(task.id)}
                                                sx={{ mr: 1, color: '#388e3c' }}
                                            >
                                                <CheckCircleIcon color="success" />
                                            </IconButton>
                                            <IconButton
                                                edge="end"
                                                onClick={() => handleCancelTask(task.id)}
                                                sx={{ color: '#e53935' }}
                                            >
                                                <CancelIcon color="error" />
                                            </IconButton>
                                        </>
                                    )}
                                    {task.status === 'cancelled' && (
                                        <IconButton
                                            edge="end"
                                            onClick={() => handleUpdateTask(task.id, { ...task, status: 'pending' })}
                                            sx={{ color: '#3fc8e0' }}
                                        >
                                            <RestoreIcon color="primary" />
                                            <Typography variant="caption" ml={0.5}>Restore</Typography>
                                        </IconButton>
                                    )}
                                </ListItemSecondaryAction>
                            </ListItem>
                        ))
                    )}
                </List>
            </Paper>
        </Box>
    );
};

export default TaskList;
