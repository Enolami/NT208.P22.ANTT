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
import dayjs from 'dayjs';

const TaskList = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);

    const fetchTasks = async () => {
        try {
            setLoading(true);
            console.log('Fetching tasks...'); // Debug log
            const response = await taskService.getAllTasks();
            console.log('Raw API response:', response); // Debug log
            
            // Ensure we have an array of tasks
            const tasksArray = Array.isArray(response) ? response : [];
            console.log('Processed tasks array:', tasksArray); // Debug log
            
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
        console.log('TaskList component mounted'); // Debug log
        fetchTasks();
    }, []);

    const handleCreateTask = async (taskData) => {
        try {
            console.log('Creating task with data:', taskData); // Debug log
            const response = await taskService.createTask(taskData);
            console.log('Task created successfully:', response); // Debug log
            setShowForm(false);
            await fetchTasks(); // Refresh the task list
        } catch (err) {
            console.error('Error creating task:', err);
            throw err; // Let the form handle the error
        }
    };

    const handleUpdateTask = async (taskId, taskData) => {
        try {
            console.log('Updating task:', taskId, taskData); // Debug log
            const response = await taskService.updateTask(taskId, taskData);
            console.log('Task updated successfully:', response); // Debug log
            setSelectedTask(null);
            await fetchTasks();
        } catch (err) {
            console.error('Error updating task:', err);
            throw err;
        }
    };

    const handleDeleteTask = async (taskId) => {
        try {
            console.log('Deleting task:', taskId); // Debug log
            await taskService.deleteTask(taskId);
            console.log('Task deleted successfully'); // Debug log
            await fetchTasks();
        } catch (err) {
            console.error('Error deleting task:', err);
            setError('Failed to delete task. Please try again.');
        }
    };

    const handleCompleteTask = async (taskId) => {
        try {
            console.log('Completing task:', taskId); // Debug log
            await taskService.completeTask(taskId);
            console.log('Task completed successfully'); // Debug log
            await fetchTasks();
        } catch (err) {
            console.error('Error completing task:', err);
            setError('Failed to complete task. Please try again.');
        }
    };

    const handleCancelTask = async (taskId) => {
        try {
            console.log('Cancelling task:', taskId); // Debug log
            await taskService.cancelTask(taskId);
            console.log('Task cancelled successfully'); // Debug log
            await fetchTasks();
        } catch (err) {
            console.error('Error cancelling task:', err);
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
        if (priority === 'high') return '#ffd6d6'; // softer red
        if (priority === 'medium') return '#fffbe6'; // soft yellow
        return '#fff'; // low
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'completed': return 'Đã hoàn thành';
            case 'cancelled': return 'Đã hủy';
            case 'pending': return 'Đang chờ';
            case 'in_progress': return 'Đang thực hiện';
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
        <Box p={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4">Tasks</Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => setShowForm(true)}
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

            <Paper>
                <List>
                    {tasks.length === 0 ? (
                        <ListItem>
                            <ListItemText
                                primary="No tasks found"
                                secondary="Create a new task to get started"
                            />
                        </ListItem>
                    ) : (
                        tasks.map((task) => (
                            <ListItem
                                key={task.id}
                                divider
                                sx={{
                                    bgcolor: getPriorityBg(task.priority)
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
                                            />
                                            <Chip
                                                label={getStatusLabel(task.status)}
                                                size="small"
                                                color={getStatusColor(task.status)}
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
                                        sx={{ mr: 1 }}
                                    >
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton
                                        edge="end"
                                        onClick={() => handleDeleteTask(task.id)}
                                        sx={{ mr: 1 }}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                    {task.status === 'completed' && (
                                        <IconButton
                                            edge="end"
                                            onClick={() => handleUpdateTask(task.id, { ...task, status: 'pending' })}
                                            sx={{ mr: 1 }}
                                        >
                                            <CheckCircleIcon color="disabled" />
                                            <Typography variant="caption" ml={0.5}>Đặt lại chờ</Typography>
                                        </IconButton>
                                    )}
                                    {(task.status === 'pending' || task.status === 'in_progress') && (
                                        <>
                                            <IconButton
                                                edge="end"
                                                onClick={() => handleCompleteTask(task.id)}
                                                sx={{ mr: 1 }}
                                            >
                                                <CheckCircleIcon color="success" />
                                            </IconButton>
                                            <IconButton
                                                edge="end"
                                                onClick={() => handleCancelTask(task.id)}
                                            >
                                                <CancelIcon color="error" />
                                            </IconButton>
                                        </>
                                    )}
                                    {task.status === 'cancelled' && (
                                        <IconButton
                                            edge="end"
                                            onClick={() => handleUpdateTask(task.id, { ...task, status: 'pending' })}
                                        >
                                            <RestoreIcon color="primary" />
                                            <Typography variant="caption" ml={0.5}>Khôi phục</Typography>
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