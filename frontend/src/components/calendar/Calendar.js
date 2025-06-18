import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    IconButton,
    Grid,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Fab, // Fab có vẻ không được dùng trong bản gộp, có thể bỏ nếu không cần
    List,
    ListItem,
    ListItemText,
    Divider,
    ToggleButton,
    ToggleButtonGroup,
    Chip,
    Alert
} from '@mui/material';
import {
    Add as AddIcon // Giữ icon AddIcon từ cả hai bản
} from '@mui/icons-material';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import isBetween from 'dayjs/plugin/isBetween'; // Giữ isBetween từ bản (1) vì nó vẫn có thể cần cho các trường hợp khác. Nếu không dùng thì có thể xóa sau.
import taskService from '../../services/taskService'; // Path điều chỉnh thành '../../services/taskService'
import api from '../../services/api'; // Path điều chỉnh thành '../../services/api'
import outlookService from '../../services/outlookService';
import { eventsAPI } from '../../services/api';
import { useTheme } from '@mui/material/styles';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

const weekDaysVN = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

dayjs.extend(utc);
dayjs.extend(isBetween); // Giữ isBetween

const Calendar = () => {
    const theme = useTheme();
    const [currentWeek, setCurrentWeek] = useState(dayjs().startOf('week'));
    const [showDayDialog, setShowDayDialog] = useState(false);
    const [dayTasks, setDayTasks] = useState([]);
    const [dayEvents, setDayEvents] = useState([]);
    const [selectedDay, setSelectedDay] = useState(null);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [tasks, setTasks] = useState([]);
    const [syncedEvents, setSyncedEvents] = useState([]); // syncedEvents có vẻ không được dùng, có thể xóa nếu không cần.
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('week'); // 'today' | 'week' | 'month'
    const [lastSyncTime, setLastSyncTime] = useState(null);
    const [outlookConnected, setOutlookConnected] = useState(false);
    const [outlookConnecting, setOutlookConnecting] = useState(false);
    const [outlookError, setOutlookError] = useState(null);
    const [showGlobalSyncDialog, setShowGlobalSyncDialog] = useState(false); // Thêm từ bản semi
    const [globalSyncLoading, setGlobalSyncLoading] = useState(false); // Thêm từ bản semi
    const [globalSyncMessage, setGlobalSyncMessage] = useState(''); // Thêm từ bản semi

    // Add new task form state
    const [newTask, setNewTask] = useState({
        task_name: '',
        description: '',    
        start_time: dayjs().format('YYYY-MM-DDTHH:mm'),
        end_time: dayjs().add(1, 'hour').format('YYYY-MM-DDTHH:mm'),
        priority: 'medium',
        status: 'pending',
    });
    const [addError, setAddError] = useState('');
    const [addLoading, setAddLoading] = useState(false);
    const [showTodayTasks, setShowTodayTasks] = useState(false); // Thêm từ bản semi

    const fetchAllTasksAndEvents = async () => {
        setLoading(true);
        try {
            // Fetch all in parallel
            const [local, google, outlook, eventRes] = await Promise.all([
                taskService.getAllTasks(),
                api.post('/calendarsync/google/sync/'),
                outlookConnected ? outlookService.sync() : Promise.resolve({ events: [], tasks: [] }), // Sử dụng outlookService.sync() từ bản semi
                eventsAPI.getEvents()
            ]);

            // Local tasks
            const localTasks = Array.isArray(local) ? local : [];

            // Google
            const googleEvents = (google.data?.events || []).map(event => ({
                id: `google_event_${event.id}`,
                title: event.summary, // Giữ title, nếu muốn dùng task_name thì cần đổi tên key ở BE
                description: event.description,
                start_time: event.start?.dateTime || event.start?.date,
                end_time: event.end?.dateTime || event.end?.date,
                priority: 'medium',
                status: 'pending',
                external_id: event.external_id,
                external_provider: 'google_event'
            }));
            const googleTasks = (google.data?.tasks || []).map(task => ({
                id: `google_task_${task.id}`,
                task_name: task.title, // Giữ task_name
                description: task.description,
                due_date: task.due_date,
                priority: 'medium',
                status: task.status || 'pending',
                external_id: task.external_id,
                external_provider: 'google_tasks'
            }));
            
            // Outlook
            const outlookEvents = (outlook.events || []).map(event => ({ // outlook.events từ bản semi
                id: `outlook_event_${event.id}`,
                title: event.summary, // Giữ title, nếu muốn dùng task_name thì cần đổi tên key ở BE
                description: event.description,
                start_time: event.start?.dateTime || event.start?.date, // Sử dụng start?.dateTime || start?.date từ bản semi
                end_time: event.end?.dateTime || event.end?.date, // Sử dụng end?.dateTime || end?.date từ bản semi
                priority: 'medium',
                status: 'pending',
                external_id: event.external_id,
                external_provider: 'outlook_event'
            }));
            const outlookTasks = (outlook.tasks || []).map(task => ({ // outlook.tasks từ bản semi
                id: `outlook_task_${task.id}`,
                task_name: task.title, // Giữ task_name
                description: task.description,
                start_time: task.created_at,
                end_time: task.due_date, // end_time là due_date từ bản semi
                priority: 'medium',
                status: task.status || 'pending',
                external_id: task.external_id,
                external_provider: 'outlook_tasks'
            }));
            
            // Events from Event model
            const eventModelEvents = (eventRes.data || []).map(event => ({
                id: `event_model_${event.id}`,
                title: event.title, // Giữ title, nếu muốn dùng task_name thì cần đổi tên key ở BE
                description: event.description,
                start_time: event.start?.dateTime || event.start_time,
                end_time: event.end?.dateTime || event.end_time,
                priority: 'medium',
                status: 'pending',
                external_id: event.external_id,
                external_provider: 'event_model',
                location: event.location
            }));

            // Merge all
            setTasks([
                ...localTasks,
                ...googleTasks,
                ...googleEvents,
                ...outlookTasks,
                ...outlookEvents,
                ...eventModelEvents
            ]);
            setError(null);
        } catch (err) {
            console.error('[Calendar] Error fetching tasks and events:', err);
            setError('Failed to fetch tasks and events. Please try again.');
        } finally {
            setLoading(false);
            if (!error) { // Chỉ cập nhật lastSyncTime nếu không có lỗi
                 setLastSyncTime(new Date()); // Giữ lastSyncTime từ bản semi
            }
        }
    };

    // Check Outlook connection on mount
    useEffect(() => {
        const checkOutlookConnection = async () => {
            try {
                const response = await outlookService.checkConnection();
                setOutlookConnected(response.connected);
            } catch (err) {
                console.error('Error checking Outlook connection:', err);
            }
        };
        checkOutlookConnection();
    }, []);

    // Replace the useEffect for fetching tasks/events
    useEffect(() => {
        fetchAllTasksAndEvents();
        // Set up periodic sync
        const syncInterval = setInterval(() => {
            fetchAllTasksAndEvents();
        }, 300000); // Sync every 5 minutes
        return () => clearInterval(syncInterval);
    }, [outlookConnected]);

    const getWeekDays = () => {
        return Array.from({ length: 7 }, (_, i) => currentWeek.add(i, 'day'));
    };

    const getItemsForDay = (day) => {
        const dayStart = dayjs(day).startOf('day');
        // const dayEnd = dayjs(day).endOf('day'); // Không cần dayEnd nếu dùng isBetween

        return { 
            localTasks: tasks.filter(task => 
                !task.external_provider && dayjs(task.start_time).isSame(dayStart, 'day') // Dùng isSame
            ),
            googleTasks: tasks.filter(task => 
                task.external_provider === 'google_tasks' && dayjs(task.due_date).isSame(dayStart, 'day') // Dùng isSame
            ),
            outlookTasks: tasks.filter(task => 
                task.external_provider === 'outlook_tasks' && dayjs(task.due_date).isSame(dayStart, 'day') // Dùng isSame
            ),
            googleEvents: tasks.filter(task => 
                task.external_provider === 'google_event' && dayjs(task.start_time).isSame(dayStart, 'day') // Dùng isSame
            ),
            outlookEvents: tasks.filter(task => 
                task.external_provider === 'outlook_event' && dayjs(task.start_time).isSame(dayStart, 'day') // Dùng isSame
            ),
            eventModelEvents: tasks.filter(task => 
                task.external_provider === 'event_model' && dayjs(task.start_time).isSame(dayStart, 'day') // Dùng isSame
            )
        };
    };

    const handleDayClick = (date) => {
        const { localTasks, googleTasks, outlookTasks, googleEvents, outlookEvents, eventModelEvents } = getItemsForDay(date);
        setSelectedDay(date);
        setDayTasks([...localTasks, ...googleTasks, ...outlookTasks]);
        setDayEvents([...googleEvents, ...outlookEvents, ...eventModelEvents]);
        setShowDayDialog(true);
    };

    const handlePrevWeek = () => setCurrentWeek(currentWeek.subtract(1, 'week'));
    const handleNextWeek = () => setCurrentWeek(currentWeek.add(1, 'week'));
    const handleToday = () => setCurrentWeek(dayjs().startOf('week')); // Giữ hàm này cho week view, nhưng nút "Hôm nay" được điều chỉnh vị trí và chức năng

    const handleAddClick = () => setShowAddDialog(true);
    const handleAddDialogClose = () => setShowAddDialog(false);

    // Month view helpers
    const [currentMonth, setCurrentMonth] = useState(dayjs().startOf('month'));
    const getMonthDays = () => {
        const daysInMonth = currentMonth.daysInMonth();
        const firstDayOfMonth = currentMonth.startOf('month').day();
        const days = [];
        for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
        for (let i = 1; i <= daysInMonth; i++) days.push(currentMonth.date(i));
        return days;
    };
    const handlePrevMonth = () => setCurrentMonth(currentMonth.subtract(1, 'month'));
    const handleNextMonth = () => setCurrentMonth(currentMonth.add(1, 'month'));
    const handleMonthToday = () => setCurrentMonth(dayjs().startOf('month'));

    // View switcher
    const handleViewChange = (event, newView) => {
        if (newView) setViewMode(newView);
    };

    // Today view
    const today = dayjs();
    const todayItems = getItemsForDay(today);

    const handleNewTaskChange = (e) => {
        const { name, value } = e.target;
        setNewTask((prev) => ({ ...prev, [name]: value }));
    };

    // Helper: Push a single task/event to a calendar (Google/Outlook)
    const pushToCalendar = async (item, provider) => {
        try {
            if (provider === 'google') {
                if (item.external_provider === 'google_event' || item.external_provider === 'google_tasks') {
                    return;
                }
                try {
                    if (item.end_time) {
                        await api.post('/calendarsync/events/push/', { 
                            id: item.id,
                            provider: 'google'
                        });
                    } else {
                        await api.post('/calendarsync/google/push_tasks/', { 
                            id: item.id,
                            provider: 'google'
                        });
                    }
                } catch (err) {
                    console.error('[pushToCalendar] Error pushing to Google:', err);
                }
            } else if (provider === 'outlook') {
                if (item.external_provider === 'outlook_event' || item.external_provider === 'outlook_tasks') {
                    return;
                }
                try {
                    if (item.end_time) {
                        await api.post('/calendarsync/outlook/push_events/', { 
                            id: item.id,
                            provider: 'outlook'
                        });
                    } else {
                        await api.post('/calendarsync/outlook/push_tasks/', { 
                            id: item.id,
                            provider: 'outlook'
                        });
                    }
                } catch (err) {
                    console.error('[pushToCalendar] Error pushing to Outlook:', err);
                }
            }
        } catch (error) {
            console.error('[pushToCalendar] Unexpected error:', error);
        }
    };

    // Global Sync: Push all data to all connected calendars, avoiding duplicates (Thêm từ bản semi)
    const handleGlobalSync = async () => {
        setGlobalSyncLoading(true);
        setGlobalSyncMessage('');
        try {
            const allItems = [...tasks];
            const promises = [];
            // Google
            // Logic để push to Google, đảm bảo không trùng lặp dựa trên external_id và provider
            // Tạm thời bỏ qua phần này vì phức tạp và có thể cần điều chỉnh logic backend để tránh duplicate
            // if (tasks.some(t => t.external_provider === 'google_event' || t.external_provider === 'google_tasks')) {
            //     allItems.forEach(item => {
            //         if (!item.external_id || (item.external_provider !== 'google_event' && item.external_provider !== 'google_tasks')) {
            //             promises.push(pushToCalendar(item, 'google'));
            //         }
            //     });
            // }
            // Outlook
            // Logic để push to Outlook, đảm bảo không trùng lặp
            // if (tasks.some(t => t.external_provider === 'outlook_event' || t.external_provider === 'outlook_tasks')) {
            //     allItems.forEach(item => {
            //         if (!item.external_id || (item.external_provider !== 'outlook_event' && item.external_provider !== 'outlook_tasks')) {
            //             promises.push(pushToCalendar(item, 'outlook'));
            //         }
            //     });
            // }

            // Đơn giản hóa: chỉ push tất cả các tasks local sang các lịch đã kết nối.
            // Nếu bạn muốn sync toàn bộ, bao gồm cả các tasks/events đã kéo về,
            // logic kiểm tra external_id sẽ phức tạp hơn và cần đồng bộ với backend.
            const localOnlyTasks = allItems.filter(item => !item.external_provider);
            const googleConnected = (await api.get('/calendarsync/check-google-connection/')).data.connected;
            const outlookConnectedStatus = (await api.get('/calendarsync/check-outlook-connection/')).data.connected;

            if (googleConnected) {
                localOnlyTasks.forEach (item => promises.push(pushToCalendar(item, 'google')));
            }
            if (outlookConnectedStatus) {
                localOnlyTasks.forEach (item => promises.push(pushToCalendar(item, 'outlook')));
            }

            await Promise.all(promises);
            await fetchAllTasksAndEvents(); // Refresh data after pushing
            setGlobalSyncMessage('Global sync completed successfully!');
            setShowGlobalSyncDialog(false);
        } catch (err) {
            console.error('[GlobalSync] Error during global sync:', err);
            setGlobalSyncMessage('Global sync failed. Please try again.');
        } finally {
            setGlobalSyncLoading(false);
        }
    };

    // Update handleAddTask to use the correct endpoints
    const handleAddTask = async () => {
        setAddLoading(true);
        setAddError('');
        try {
            const start = dayjs(newTask.start_time);
            const end = dayjs(newTask.end_time);
            const now = dayjs();
            
            if (newTask.status !== 'completed' && end.isBefore(now)) {
                setAddError('Thời gian kết thúc không được ở trong quá khứ nếu chưa hoàn thành.');
                setAddLoading(false);
                return;
            }

            // Always set due_date = end_time
            const payload = {
                ...newTask,
                start_time: start.format('YYYY-MM-DDTHH:mm:ssZ'),
                end_time: end.format('YYYY-MM-DDTHH:mm:ssZ'),
                due_date: end.format('YYYY-MM-DDTHH:mm:ssZ'),
            };
            // Create the task/event
            const created = await taskService.createTask(payload);
            setShowAddDialog(false);
            setNewTask({
                task_name: '',
                description: '',
                start_time: dayjs().format('YYYY-MM-DDTHH:mm'),
                end_time: dayjs().add(1, 'hour').format('YYYY-MM-DDTHH:mm'),
                priority: 'medium',
                status: 'pending',
            });
            // Refresh the calendar data
            await fetchAllTasksAndEvents();
            // Push to connected calendars
            if (created && created.id) {
                try {
                    // Check if Google Calendar is connected
                    const googleResponse = await api.get('/calendarsync/check-google-connection/');
                    if (googleResponse.data.connected) {
                        if (payload.end_time) {
                            // Create new event in Google Calendar
                            await api.post('/calendarsync/events/push/', { 
                                id: created.id,
                                provider: 'google'
                            });
                        } else {
                            // Create new task in Google Tasks
                            await api.post('/calendarsync/google/push_tasks/', { 
                                id: created.id,
                                provider: 'google'
                            });
                        }
                    }

                    // Check if Outlook is connected
                    const outlookResponse = await api.get('/calendarsync/check-outlook-connection/');
                    if (outlookResponse.data.connected) {
                        if (payload.end_time) {
                            // Create new event in Outlook Calendar
                            await api.post('/calendarsync/outlook/push_events/', { 
                                id: created.id,
                                provider: 'outlook'
                            });
                        } else {
                            // Create new task in Outlook Tasks
                            await api.post('/calendarsync/outlook/push_tasks/', { 
                                id: created.id,
                                provider: 'outlook'
                            });
                        }
                    }
                } catch (error) {
                    console.error('Error pushing to calendars:', error);
                    // Don't show error to user as the task was created successfully
                }
            }
        } catch (err) {
            console.error('Error creating task:', err);
            setAddError('Không thể tạo công việc mới.');
        } finally {
            setAddLoading(false);
        }
    };

    // Helper cho màu nền ưu tiên
    const getPriorityBg = (priority) => {
        if (priority === 'high') return '#ffd6d6'; // softer red
        if (priority === 'medium') return '#fffbe6'; // soft yellow
        return '#dcfce7'; // low
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

    const renderDayDialog = () => (
        <Dialog open={showDayDialog} onClose={() => setShowDayDialog(false)} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ fontFamily: 'Poppins,Roboto', color: '#007AFF', fontWeight: 700 }}>
                Chi tiết ngày {selectedDay && selectedDay.format('DD/MM/YYYY')}
            </DialogTitle>
            <DialogContent>
                <Typography variant="subtitle2" mb={1}>Công việc nội bộ</Typography>
                <List>
                    {dayTasks.filter(task => !task.external_provider).length === 0 && 
                        <ListItem>
                            <ListItemText
                                primary={
                                    <span>
                                        <img src="/empty-task.svg" alt="" style={{ width: 32, marginRight: 8, verticalAlign: 'middle' }} />
                                        <span style={{ color: '#b0b0b0', fontWeight: 500 }}>Không có công việc nội bộ nào</span>
                                    </span>
                                }
                            />
                        </ListItem>}
                    {dayTasks.filter(task => !task.external_provider).map(task => (
                        <React.Fragment key={`task-${task.id}`}>
                            <ListItem alignItems="flex-start">
                                <ListItemText
                                    primary={task.task_name}
                                    secondary={<>
                                        <Typography component="span" variant="body2" color="text.primary">{task.description}</Typography><br/>
                                        <Typography component="span" variant="caption" color="text.secondary">
                                            {dayjs(task.due_date).format('HH:mm')}
                                        </Typography>
                                    </>}
                                />
                                <Chip label={getStatusLabel(task.status)} size="small" color={getStatusColor(task.status)} sx={{ ml: 1 }} />
                            </ListItem>
                            <Divider />
                        </React.Fragment>
                    ))}
                </List>

                <Typography variant="subtitle2" mb={1} mt={2}>Công việc Google Tasks</Typography>
                <List>
                    {dayTasks.filter(task => task.external_provider === 'google_tasks').length === 0 && 
                        <ListItem><ListItemText primary="Không có công việc Google Tasks nào" /></ListItem>}
                    {dayTasks.filter(task => task.external_provider === 'google_tasks').map(task => (
                        <React.Fragment key={`gtask-${task.id}`}>
                            <ListItem alignItems="flex-start">
                                <ListItemText
                                    primary={task.task_name}
                                    secondary={<>
                                        <Typography component="span" variant="body2" color="text.primary">{task.description}</Typography><br/>
                                        <Typography component="span" variant="caption" color="text.secondary">
                                            {dayjs(task.due_date).format('HH:mm')}
                                        </Typography>
                                    </>}
                                />
                                <Chip label="Google Task" size="small" color="success" sx={{ ml: 1 }} />
                            </ListItem>
                            <Divider />
                        </React.Fragment>
                    ))}
                </List>

                <Typography variant="subtitle2" mb={1} mt={2}>Công việc Outlook Tasks</Typography>
                <List>
                    {dayTasks.filter(task => task.external_provider === 'outlook_tasks').length === 0 && 
                        <ListItem><ListItemText primary="Không có công việc Outlook Tasks nào" /></ListItem>}
                    {dayTasks.filter(task => task.external_provider === 'outlook_tasks').map(task => (
                        <React.Fragment key={`otask-${task.id}`}>
                            <ListItem alignItems="flex-start">
                                <ListItemText
                                    primary={task.task_name}
                                    secondary={<>
                                        <Typography component="span" variant="body2" color="text.primary">{task.description}</Typography><br/>
                                        <Typography component="span" variant="caption" color="text.secondary">
                                            {dayjs(task.start_time).format('HH:mm')}
                                        </Typography>
                                    </>}
                                />
                                <Chip label="Outlook Task" size="small" color="info" sx={{ ml: 1 }} />
                            </ListItem>
                            <Divider />
                        </React.Fragment>
                    ))}
                </List>

                <Typography variant="subtitle2" mb={1} mt={2}>Sự kiện Google Calendar</Typography>
                <List>
                    {dayEvents.filter(event => event.external_provider === 'google_event').length === 0 && 
                        <ListItem><ListItemText primary="Không có sự kiện Google Calendar nào" /></ListItem>}
                    {dayEvents.filter(event => event.external_provider === 'google_event').map(event => (
                        <React.Fragment key={`event-${event.id}`}>
                            <ListItem alignItems="flex-start">
                                <ListItemText
                                    primary={event.title} // Giữ title cho events
                                    secondary={<>
                                        <Typography component="span" variant="body2" color="text.primary">{event.description}</Typography><br/>
                                        <Typography component="span" variant="caption" color="text.secondary">
                                            {dayjs(event.start_time).format('HH:mm')} - 
                                            {dayjs(event.end_time).format('HH:mm')}
                                        </Typography>
                                    </>}
                                />
                                <Chip label="Google Calendar" size="small" color="primary" sx={{ ml: 1 }} />
                            </ListItem>
                            <Divider />
                        </React.Fragment>
                    ))}
                </List>

                <Typography variant="subtitle2" mb={1} mt={2}>Sự kiện Outlook Calendar</Typography>
                <List>
                    {dayEvents.filter(event => event.external_provider === 'outlook_event').length === 0 && 
                        <ListItem><ListItemText primary="Không có sự kiện Outlook Calendar nào" /></ListItem>}
                    {dayEvents.filter(event => event.external_provider === 'outlook_event').map(event => (
                        <React.Fragment key={`oevent-${event.id}`}>
                            <ListItem alignItems="flex-start">
                                <ListItemText
                                    primary={event.title} // Giữ title cho events
                                    secondary={<>
                                        <Typography component="span" variant="body2" color="text.primary">{event.description}</Typography><br/>
                                        <Typography component="span" variant="caption" color="text.secondary">
                                            {dayjs(event.start_time).format('HH:mm')} - 
                                            {dayjs(event.end_time).format('HH:mm')}
                                        </Typography>
                                    </>}
                                /> 
                                <Chip label="Outlook Calendar" size="small" color="info" sx={{ ml: 1 }} />
                            </ListItem>
                            <Divider />
                        </React.Fragment>
                    ))}
                </List>

                <Typography variant="subtitle2" mb={1} mt={2}>Sự kiện nội bộ</Typography>
                <List>
                    {dayEvents.filter(event => event.external_provider === 'event_model').length === 0 &&
                        <ListItem><ListItemText primary="Không có sự kiện nội bộ nào" /></ListItem>}
                    {dayEvents.filter(event => event.external_provider === 'event_model').map(event => (
                        <React.Fragment key={`emevent-${event.id}`}>
                            <ListItem alignItems="flex-start">
                                <ListItemText
                                    primary={event.title} // Giữ title cho events
                                    secondary={<>
                                        <Typography component="span" variant="body2" color="text.primary">{event.description}</Typography><br/>
                                        <Typography component="span" variant="caption" color="text.secondary">
                                            {dayjs(event.start_time).format('HH:mm')} - {dayjs(event.end_time).format('HH:mm')}
                                        </Typography>
                                    </>}
                                />
                                <Chip label="Sự kiện nội bộ" size="small" color="warning" sx={{ ml: 1 }} />
                            </ListItem>
                            <Divider />
                        </React.Fragment>
                    ))}
                </List>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setShowDayDialog(false)} sx={{
                    background: '#007AFF',
                    color: '#fff',
                    borderRadius: 2,
                    fontWeight: 600,
                    fontFamily: 'Roboto',
                    boxShadow: '0 2px 8px #007aff22',
                    '&:hover': { background: '#005ecb' }
                }}>Đóng</Button>
            </DialogActions>
        </Dialog>
    );

    // Helper để lấy màu nền cho các box ngày/tháng
    const getDayPaperBg = (date) => {
        if (date && date.isSame && date.isSame(dayjs(), 'day')) {
            return theme.palette.mode === 'dark' ? '#2b3350' : '#e3eaff';
        }
        return theme.palette.background.paper;
    };

    const renderWeekView = () => (
        <>
            <Box display="flex" alignItems="center" mb={1}>
                <IconButton onClick={handlePrevWeek}>&lt;</IconButton> {/* Thêm icon cho Prev Week */}
                <Typography variant="h6" sx={{ mx: 2 }}>
                    {currentWeek.format('DD/MM/YYYY')} - {currentWeek.add(6, 'day').format('DD/MM/YYYY')}
                </Typography>
                <IconButton onClick={handleNextWeek}>&gt;</IconButton> {/* Thêm icon cho Next Week */}
                {/* Nút Hôm nay ở đây sẽ được di chuyển ra ngoài renderWeekView, để đồng bộ với ToggleButtonGroup */}
            </Box>
            <Box display="flex" mb={1}>
                {weekDaysVN.map((day, idx) => (
                    <Box key={day} flex={1} textAlign="center" fontWeight="bold">{day}</Box>
                ))}
            </Box>
            <Box display="flex" minHeight={120}>
                {getWeekDays().map((date, idx) => {
                    const { localTasks, googleTasks, outlookTasks, googleEvents, outlookEvents, eventModelEvents } = getItemsForDay(date);
                    return (
                        <Paper
                            key={idx}
                            sx={{
                                flex: 1,
                                mx: 0.5,
                                p: 1,
                                bgcolor: getDayPaperBg(date),
                                cursor: 'pointer',
                                minHeight: 100,
                                border: date.isSame(dayjs(), 'day')
                                    ? `2px solid ${theme.palette.primary.main}`
                                    : `1px solid ${theme.palette.divider}`,
                                transition: 'background 0.3s, border 0.3s'
                            }}
                            onClick={() => handleDayClick(date)}
                        >
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Typography variant="subtitle2">{date.date()}</Typography>
                            </Box>
                            <Box mt={1}>
                                {localTasks.slice(0, 2).map(task => (
                                    <Box key={`task-${task.id}`} mb={0.5} px={1} py={0.5} borderRadius={1} bgcolor={getPriorityBg(task.priority)}>
                                        <Typography variant="body2" fontWeight={500} color={task.priority === 'high' ? 'error.main' : task.priority === 'medium' ? 'warning.main' : 'success.main'} noWrap>
                                            {task.task_name}
                                        </Typography>
                                        <Chip label={getStatusLabel(task.status)} size="small" color={getStatusColor(task.status)} sx={{ ml: 1 }} />
                                    </Box>
                                ))}
                                {googleTasks.slice(0, 2).map(task => (
                                    <Box key={`gtask-${task.id}`} mb={0.5} px={1} py={0.5} borderRadius={1} bgcolor="#e8f5e9">
                                        <Typography variant="body2" fontWeight={500} color="success.main" noWrap>
                                            {task.task_name}
                                        </Typography>
                                        <Chip label="Google Task" size="small" color="success" sx={{ ml: 1 }} />
                                    </Box>
                                ))}
                                {outlookTasks.slice(0, 2).map(task => (
                                    <Box key={`otask-${task.id}`} mb={0.5} px={1} py={0.5} borderRadius={1} bgcolor="#e3f2fd">
                                        <Typography variant="body2" fontWeight={500} color="info.main" noWrap>
                                            {task.task_name}
                                        </Typography>
                                        <Chip label="Outlook Task" size="small" color="info" sx={{ ml: 1 }} />
                                    </Box>
                                ))}
                                {googleEvents.slice(0, 2).map(event => (
                                    <Box key={`event-${event.id}`} mb={0.5} px={1} py={0.5} borderRadius={1} bgcolor="#e3f2fd">
                                        <Typography variant="body2" fontWeight={500} color="primary.main" noWrap>
                                            {event.title} {/* Giữ title cho events */}
                                        </Typography>
                                        <Chip label="Google Calendar" size="small" color="primary" sx={{ ml: 1 }} />
                                    </Box>
                                ))}
                                {outlookEvents.slice(0, 2).map(event => (
                                    <Box key={`oevent-${event.id}`} mb={0.5} px={1} py={0.5} borderRadius={1} bgcolor="#e3f2fd">
                                        <Typography variant="body2" fontWeight={500} color="info.main" noWrap>
                                            {event.title} {/* Giữ title cho events */}
                                        </Typography>
                                        <Chip label="Outlook Calendar" size="small" color="info" sx={{ ml: 1 }} />
                                    </Box>
                                ))}
                                {eventModelEvents.slice(0, 2).map(event => (
                                    <Box key={`mevent-${event.id}`} mb={0.5} px={1} py={0.5} borderRadius={1} bgcolor="#fff3e0">
                                        <Typography variant="body2" fontWeight={500} color="warning.main" noWrap>
                                            {event.title} {/* Giữ title cho events */}
                                        </Typography>
                                        <Chip label="Event" size="small" color="warning" sx={{ ml: 1 }} />
                                    </Box>
                                ))}
                                {(localTasks.length + googleTasks.length + outlookTasks.length + googleEvents.length + outlookEvents.length + eventModelEvents.length) > 2 && 
                                    <Typography variant="caption" color="text.secondary">
                                        +{(localTasks.length + googleTasks.length + outlookTasks.length + googleEvents.length + outlookEvents.length + eventModelEvents.length) - 2} thêm
                                    </Typography>}
                            </Box>
                        </Paper>
                    );
                })}
            </Box>
        </>
    );

    return (
        <Box
            sx={{
                maxWidth: 1100,
                margin: '0 auto',
                background: theme.palette.background.paper,
                color: theme.palette.text.primary,
                borderRadius: 3,
                boxShadow: theme.palette.mode === 'dark'
                    ? '0 2px 16px rgba(60,72,100,0.18)'
                    : '0 2px 16px rgba(60,72,100,0.08)',
                fontFamily: "'Quicksand', Arial, sans-serif",
                transition: 'background 0.3s, color 0.3s'
            }}
        >
            {lastSyncTime && (
                <Typography variant="caption" color="text.secondary" mb={2} display="block">
                    Last synced: {lastSyncTime.toLocaleString()}
                </Typography>
            )}
            {outlookError && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setOutlookError(null)}>
                    {outlookError}
                </Alert>
            )}
            {globalSyncMessage && ( // Thêm Alert cho Global Sync Message
                <Alert severity={globalSyncMessage.includes('successfully') ? 'success' : 'error'} sx={{ mb: 2 }} onClose={() => setGlobalSyncMessage('')}>
                    {globalSyncMessage}
                </Alert>
            )}
            <Box display="flex" mb={2}>
                <ToggleButtonGroup
                    value={viewMode}
                    exclusive
                    onChange={handleViewChange}
                    aria-label="calendar view mode"
                    sx={{
                        background: theme.palette.background.paper,
                        borderRadius: 2,
                        fontWeight: 600,
                        boxShadow: theme.palette.mode === 'dark'
                            ? '0 2px 8px 0 #23263a'
                            : '0 2px 8px 0 #3fc8e022',
                        '& .MuiToggleButton-root': {
                            background: theme.palette.background.paper,
                            color: theme.palette.primary.main,
                            border: 'none',
                            borderRadius: 2,
                            fontWeight: 700,
                            fontSize: '1.08rem',
                            px: 3,
                            py: 1.5,
                            '&.Mui-selected': {
                                background: theme.palette.primary.main,
                                color: '#fff',
                            }
                        }
                    }}
                >
                    <ToggleButton value="today">Ngày</ToggleButton>
                    <ToggleButton value="week">Tuần</ToggleButton>
                    <ToggleButton value="month">Tháng</ToggleButton>
                </ToggleButtonGroup>
                <Box flex={1} />
                <Box display="flex" gap={2}>    
                    <Button // Nút Hôm nay (Today button) với icon mới
                        onClick={() => {
                            handleToday(); // Set currentWeek to start of current week
                            setShowTodayTasks(true); // Mở dialog hôm nay
                        }}
                        sx={{ // Giữ styles từ bản (1)
                            background: "#3fc8e0",
                            color: "#fff",
                            borderRadius: 2,
                            fontWeight: 700,
                            fontSize: '1.08rem',
                            px: 3,
                            py: 1.5,
                            boxShadow: '0 2px 8px 0 #3fc8e022',
                            '&:hover': { background: '#2bb3c0' }
                        }}
                        startIcon={<i className="fa fa-calendar-day" style={{ fontSize: 18 }} />}
                    >
                        Hôm nay
                    </Button>
                    <Button // Nút Global Sync (Thêm từ bản semi)
                        variant="contained"
                        sx={{
                            background: "#fff",
                            color: "#3fc8e0",
                            borderRadius: 2,
                            fontWeight: 700,
                            fontSize: '1.08rem',
                            px: 3,
                            py: 1.5,
                            boxShadow: '0 2px 8px 0 #3fc8e022',
                            border: '1.5px solid #3fc8e0',
                            '&:hover': { background: '#e0f7fa', color: '#3fc8e0' }
                        }}
                        onClick={() => setShowGlobalSyncDialog(true)}
                        disabled={globalSyncLoading}
                        startIcon={<i className="fa fa-cloud" style={{ fontSize: 18 }} />}
                    >
                        {globalSyncLoading ? 'Syncing...' : 'Global Sync'}
                    </Button>
                    <Button // Nút Thêm mới (Add new) với style mới
                        variant="contained"
                        onClick={handleAddClick}
                        startIcon={<AddIcon sx={{ fontSize: 24 }} />}
                        sx={{ // Giữ styles từ bản (1)
                            background: "#ffb300",
                            color: "#fff",
                            borderRadius: 2,
                            fontWeight: 700,
                            fontSize: '1.13rem',
                            px: 3,
                            py: 1.5,
                            boxShadow: '0 4px 16px 0 #ffb30022',
                            '&:hover': { background: '#ffa000' }
                        }}
                    >
                        Thêm mới
                    </Button>
                </Box>
            </Box>
            {viewMode === 'today' && (
                <Box>
                    <Typography variant="h6" mb={2}>Công việc & sự kiện hôm nay ({today.format('DD/MM/YYYY')})</Typography>
                    <List>
                        {todayItems.localTasks.length === 0 && todayItems.googleTasks.length === 0 && todayItems.outlookTasks.length === 0 && todayItems.googleEvents.length === 0 && todayItems.outlookEvents.length === 0 && todayItems.eventModelEvents.length === 0 &&
                            <ListItem><ListItemText primary="Không có công việc hoặc sự kiện nào" /></ListItem>}
                        {todayItems.localTasks.map(task => (
                            <React.Fragment key={`task-${task.id}`}>
                                <ListItem alignItems="flex-start">
                                    <ListItemText
                                        primary={task.task_name}
                                        secondary={<>
                                            <Typography component="span" variant="body2" color="text.primary">{task.description}</Typography><br/>
                                            <Typography component="span" variant="caption" color="text.secondary">{dayjs(task.due_date).format('HH:mm')} - {dayjs(task.end_time).format('HH:mm')}</Typography>
                                        </>}
                                    />
                                    <Chip label={getStatusLabel(task.status)} size="small" color={getStatusColor(task.status)} sx={{ ml: 1 }} />
                                </ListItem>
                                <Divider />
                            </React.Fragment>
                        ))}
                        {todayItems.googleTasks.map(task => (
                            <React.Fragment key={`gtask-${task.id}`}>
                                <ListItem alignItems="flex-start">
                                    <ListItemText
                                        primary={task.task_name}
                                        secondary={<>
                                            <Typography component="span" variant="body2" color="text.primary">{task.description}</Typography><br/>
                                            <Typography component="span" variant="caption" color="text.secondary">{dayjs(task.due_date).format('HH:mm')}</Typography>
                                        </>}
                                    />
                                    <Chip label="Google Task" size="small" color="success" sx={{ ml: 1 }} />
                                </ListItem>
                                <Divider />
                            </React.Fragment>
                        ))}
                        {todayItems.outlookTasks.map(task => (
                            <React.Fragment key={`otask-${task.id}`}>
                                <ListItem alignItems="flex-start">
                                    <ListItemText
                                        primary={task.task_name}
                                        secondary={<>
                                            <Typography component="span" variant="body2" color="text.primary">{task.description}</Typography><br/>
                                            <Typography component="span" variant="caption" color="text.secondary">
                                                {dayjs(task.start_time).format('HH:mm')}
                                            </Typography>
                                        </>}
                                    />
                                    <Chip label="Outlook Task" size="small" color="info" sx={{ ml: 1 }} />
                                </ListItem>
                                <Divider />
                            </React.Fragment>
                        ))}
                        {todayItems.googleEvents.map(event => (
                            <React.Fragment key={`event-${event.id}`}>
                                <ListItem alignItems="flex-start">
                                    <ListItemText
                                        primary={event.title} 
                                        secondary={<>
                                            <Typography component="span" variant="body2" color="text.primary">{event.description}</Typography><br/>
                                            <Typography component="span" variant="caption" color="text.secondary">
                                                {dayjs(event.start_time).format('HH:mm')} - 
                                                {dayjs(event.end_time).format('HH:mm')}
                                            </Typography>
                                        </>}
                                    />
                                    <Chip label="Google Calendar" size="small" color="primary" sx={{ ml: 1 }} />
                                </ListItem>
                                <Divider />
                            </React.Fragment>
                        ))}
                        {todayItems.outlookEvents.map(event => (
                            <React.Fragment key={`oevent-${event.id}`}>
                                <ListItem alignItems="flex-start">
                                    <ListItemText
                                        primary={event.title} 
                                        secondary={<>
                                            <Typography component="span" variant="body2" color="text.primary">{event.description}</Typography><br/>
                                            <Typography component="span" variant="caption" color="text.secondary">
                                                {dayjs(event.start_time).format('HH:mm')} - 
                                                {dayjs(event.end_time).format('HH:mm')}
                                            </Typography>
                                        </>}
                                    />
                                    <Chip label="Outlook Calendar" size="small" color="info" sx={{ ml: 1 }} />
                                </ListItem>
                                <Divider />
                            </React.Fragment>
                        ))}
                        {todayItems.eventModelEvents.map(event => (
                            <React.Fragment key={`emevent-${event.id}`}>
                                <ListItem alignItems="flex-start">
                                    <ListItemText
                                        primary={event.title} 
                                        secondary={<>
                                            <Typography component="span" variant="body2" color="text.primary">{event.description}</Typography><br/>
                                            <Typography component="span" variant="caption" color="text.secondary">
                                                {dayjs(event.start_time).format('HH:mm')} - 
                                                {dayjs(event.end_time).format('HH:mm')}
                                            </Typography>
                                        </>}
                                    />
                                    <Chip label="Event" size="small" color="warning" sx={{ ml: 1 }} />
                                </ListItem>
                                <Divider />
                            </React.Fragment>
                        ))}
                    </List>
                </Box>
            )}
            {viewMode === 'week' && (
                <>
                    <Box display="flex" alignItems="center" mb={1} gap={2}>
                        <IconButton
                            onClick={handlePrevWeek}
                            sx={{
                                background: theme.palette.background.paper,
                                border: `1.5px solid ${theme.palette.divider}`,
                                color: theme.palette.primary.main,
                                '&:hover': {
                                    background: theme.palette.primary.light,
                                    color: theme.palette.primary.contrastText,
                                    borderColor: theme.palette.primary.main,
                                },
                                boxShadow: theme.palette.mode === 'dark'
                                    ? '0 2px 8px #23263a'
                                    : '0 2px 8px #3fc8e022',
                                mr: 1
                            }}
                            size="large"
                        >
                            <ArrowBackIosNewIcon fontSize="medium" />
                        </IconButton>
                        <Typography
                            variant="h6"
                            sx={{
                                mx: 2,
                                fontWeight: 700,
                                letterSpacing: 1,
                                color: theme.palette.text.primary,
                                fontFamily: "'Poppins', 'Roboto', Arial, sans-serif"
                            }}
                        >
                            {currentWeek.format('DD/MM/YYYY')} - {currentWeek.add(6, 'day').format('DD/MM/YYYY')}
                        </Typography>
                        <IconButton
                            onClick={handleNextWeek}
                            sx={{
                                background: theme.palette.background.paper,
                                border: `1.5px solid ${theme.palette.divider}`,
                                color: theme.palette.primary.main,
                                '&:hover': {
                                    background: theme.palette.primary.light,
                                    color: theme.palette.primary.contrastText,
                                    borderColor: theme.palette.primary.main,
                                },
                                boxShadow: theme.palette.mode === 'dark'
                                    ? '0 2px 8px #23263a'
                                    : '0 2px 8px #3fc8e022',
                                ml: 1
                            }}
                            size="large"
                        >
                            <ArrowForwardIosIcon fontSize="medium" />
                        </IconButton>
                    </Box>
                    <Box display="flex" mb={1}>
                        {weekDaysVN.map((day, idx) => (
                            <Box key={day} flex={1} textAlign="center" fontWeight="bold">{day}</Box>
                        ))}
                    </Box>
                    <Box display="flex" minHeight={120}>
                        {getWeekDays().map((date, idx) => {
                            const { localTasks, googleTasks, outlookTasks, googleEvents, outlookEvents, eventModelEvents } = getItemsForDay(date);
                            return (
                                <Paper
                                    key={idx}
                                    sx={{
                                        flex: 1,
                                        mx: 0.5,
                                        p: 1,
                                        bgcolor: getDayPaperBg(date),
                                        cursor: 'pointer',
                                        minHeight: 100,
                                        border: date.isSame(dayjs(), 'day')
                                            ? `2px solid ${theme.palette.primary.main}`
                                            : `1px solid ${theme.palette.divider}`,
                                        transition: 'background 0.3s, border 0.3s'
                                    }}
                                    onClick={() => handleDayClick(date)}
                                >
                                    <Box display="flex" justifyContent="space-between" alignItems="center">
                                        <Typography variant="subtitle2">{date.date()}</Typography>
                                    </Box>
                                    <Box mt={1}>
                                        {localTasks.slice(0, 2).map(task => (
                                            <Box key={`task-${task.id}`} mb={0.5} px={1} py={0.5} borderRadius={1} bgcolor={getPriorityBg(task.priority)}>
                                                <Typography variant="body2" fontWeight={500} color={task.priority === 'high' ? 'error.main' : task.priority === 'medium' ? 'warning.main' : 'success.main'} noWrap>
                                                    {task.task_name}
                                                </Typography>
                                                <Chip label={getStatusLabel(task.status)} size="small" color={getStatusColor(task.status)} sx={{ ml: 1 }} />
                                            </Box>
                                        ))}
                                        {googleTasks.slice(0, 2).map(task => (
                                            <Box key={`gtask-${task.id}`} mb={0.5} px={1} py={0.5} borderRadius={1} bgcolor="#e8f5e9">
                                                <Typography variant="body2" fontWeight={500} color="success.main" noWrap>
                                                    {task.task_name}
                                                </Typography>
                                                <Chip label="Google Task" size="small" color="success" sx={{ ml: 1 }} />
                                            </Box>
                                        ))}
                                        {outlookTasks.slice(0, 2).map(task => (
                                            <Box key={`otask-${task.id}`} mb={0.5} px={1} py={0.5} borderRadius={1} bgcolor="#e3f2fd">
                                                <Typography variant="body2" fontWeight={500} color="info.main" noWrap>
                                                    {task.task_name}
                                                </Typography>
                                                <Chip label="Outlook Task" size="small" color="info" sx={{ ml: 1 }} />
                                            </Box>
                                        ))}
                                        {googleEvents.slice(0, 2).map(event => (
                                            <Box key={`event-${event.id}`} mb={0.5} px={1} py={0.5} borderRadius={1} bgcolor="#e3f2fd">
                                                <Typography variant="body2" fontWeight={500} color="primary.main" noWrap>
                                                    {event.title} {/* Giữ title cho events */}
                                                </Typography>
                                                <Chip label="Google Calendar" size="small" color="primary" sx={{ ml: 1 }} />
                                            </Box>
                                        ))}
                                        {outlookEvents.slice(0, 2).map(event => (
                                            <Box key={`oevent-${event.id}`} mb={0.5} px={1} py={0.5} borderRadius={1} bgcolor="#e3f2fd">
                                                <Typography variant="body2" fontWeight={500} color="info.main" noWrap>
                                                    {event.title} {/* Giữ title cho events */}
                                                </Typography>
                                                <Chip label="Outlook Calendar" size="small" color="info" sx={{ ml: 1 }} />
                                            </Box>
                                        ))}
                                        {eventModelEvents.slice(0, 2).map(event => (
                                            <Box key={`mevent-${event.id}`} mb={0.5} px={1} py={0.5} borderRadius={1} bgcolor="#fff3e0">
                                                <Typography variant="body2" fontWeight={500} color="warning.main" noWrap>
                                                    {event.title} {/* Giữ title cho events */}
                                                </Typography>
                                                <Chip label="Event" size="small" color="warning" sx={{ ml: 1 }} />
                                            </Box>
                                        ))}
                                        {(localTasks.length + googleTasks.length + outlookTasks.length + googleEvents.length + outlookEvents.length + eventModelEvents.length) > 2 && 
                                            <Typography variant="caption" color="text.secondary">
                                                +{(localTasks.length + googleTasks.length + outlookTasks.length + googleEvents.length + outlookEvents.length + eventModelEvents.length) - 2} thêm
                                            </Typography>}
                                    </Box>
                                </Paper>
                            );
                        })}
                    </Box>
                </>
            )}
            {viewMode === 'month' && (
                <>
                    <Box display="flex" alignItems="center" mb={1} gap={2}>
                        <IconButton
                            onClick={handlePrevMonth}
                            sx={{
                                background: theme.palette.background.paper,
                                border: `1.5px solid ${theme.palette.divider}`,
                                color: theme.palette.primary.main,
                                '&:hover': {
                                    background: theme.palette.primary.light,
                                    color: theme.palette.primary.contrastText,
                                    borderColor: theme.palette.primary.main,
                                },
                                boxShadow: theme.palette.mode === 'dark'
                                    ? '0 2px 8px #23263a'
                                    : '0 2px 8px #3fc8e022',
                                mr: 1
                            }}
                            size="large"
                        >
                            <ArrowBackIosNewIcon fontSize="medium" />
                        </IconButton>
                        <Typography
                            variant="h6"
                            sx={{
                                mx: 2,
                                fontWeight: 700,
                                letterSpacing: 1,
                                color: theme.palette.text.primary,
                                fontFamily: "'Poppins', 'Roboto', Arial, sans-serif"
                            }}
                        >
                            {currentMonth.format('MM/YYYY')}
                        </Typography>
                        <IconButton
                            onClick={handleNextMonth}
                            sx={{
                                background: theme.palette.background.paper,
                                border: `1.5px solid ${theme.palette.divider}`,
                                color: theme.palette.primary.main,
                                '&:hover': {
                                    background: theme.palette.primary.light,
                                    color: theme.palette.primary.contrastText,
                                    borderColor: theme.palette.primary.main,
                                },
                                boxShadow: theme.palette.mode === 'dark'
                                    ? '0 2px 8px #23263a'
                                    : '0 2px 8px #3fc8e022',
                                ml: 1
                            }}
                            size="large"
                        >
                            <ArrowForwardIosIcon fontSize="medium" />
                        </IconButton>
                        <Button
                            onClick={handleMonthToday}
                            sx={{
                                ml: 2,
                                background: theme.palette.primary.main,
                                color: '#fff',
                                borderRadius: 2,
                                fontWeight: 700,
                                fontSize: '1.08rem',
                                px: 3,
                                py: 1.5,
                                boxShadow: '0 2px 8px 0 #3fc8e022',
                                '&:hover': { background: theme.palette.primary.dark }
                            }}
                            startIcon={<i className="fa fa-calendar-day" style={{ fontSize: 18 }} />}
                            variant="contained"
                        >
                            Hôm nay
                        </Button>
                    </Box>
                    <Box display="flex" mb={1}>
                        {weekDaysVN.map((day, idx) => (
                            <Box key={day} flex={1} textAlign="center" fontWeight="bold">{day}</Box>
                        ))}
                    </Box>
                    <Box display="flex" flexDirection="column" gap={1}>
                        {Array.from({ length: Math.ceil(getMonthDays().length / 7) }, (_, weekIndex) => {
                            // Lấy 7 ngày cho mỗi tuần, nếu thiếu thì thêm null để đủ 7 ô
                            const weekDays = getMonthDays().slice(weekIndex * 7, (weekIndex + 1) * 7);
                            const paddedWeek = [...weekDays];
                            while (paddedWeek.length < 7) paddedWeek.push(null);

                            return (
                                <Box key={weekIndex} display="flex" minHeight={120}>
                                    {paddedWeek.map((date, idx) => (
                                        <Paper
                                            key={idx}
                                            sx={{
                                                flex: 1,
                                                mx: 0.5,
                                                p: 1,
                                                bgcolor: getDayPaperBg(date),
                                                cursor: date ? 'pointer' : 'default',
                                                minHeight: 100,
                                                border: date && date.isSame && date.isSame(dayjs(), 'day')
                                                    ? `2px solid ${theme.palette.primary.main}`
                                                    : `1px solid ${theme.palette.divider}`,
                                                visibility: date ? 'visible' : 'hidden',
                                                transition: 'background 0.3s, border 0.3s'
                                            }}
                                            onClick={() => date && handleDayClick(date)}
                                        >
                                            {date && (
                                                <>
                                                    <Box display="flex" justifyContent="space-between" alignItems="center">
                                                        <Typography variant="subtitle2">{date.date()}</Typography>
                                                    </Box>
                                                    <Box mt={1}>
                                                        {date && getItemsForDay(date).localTasks.slice(0, 2).map(task => (
                                                            <Box key={task.id} mb={0.5} px={1} py={0.5} borderRadius={1} bgcolor={getPriorityBg(task.priority)}>
                                                                <Typography variant="body2" fontWeight={500} color={task.priority === 'high' ? 'error.main' : task.priority === 'medium' ? 'warning.main' : 'success.main'} noWrap>
                                                                    {task.task_name}
                                                                </Typography>
                                                                <Chip label={getStatusLabel(task.status)} size="small" color={getStatusColor(task.status)} sx={{ ml: 1 }} />
                                                            </Box>
                                                        ))}
                                                        {date && getItemsForDay(date).googleTasks.slice(0, 2).map(task => (
                                                            <Box key={task.id} mb={0.5} px={1} py={0.5} borderRadius={1} bgcolor={getPriorityBg(task.priority)}>
                                                                <Typography variant="body2" fontWeight={500} color={task.priority === 'high' ? 'error.main' : task.priority === 'medium' ? 'warning.main' : 'success.main'} noWrap>
                                                                    {task.task_name}
                                                                </Typography>
                                                                <Chip label="Google Task" size="small" color="success" sx={{ ml: 1 }} />
                                                            </Box>
                                                        ))}
                                                        {date && getItemsForDay(date).outlookTasks.slice(0, 2).map(task => (
                                                            <Box key={task.id} mb={0.5} px={1} py={0.5} borderRadius={1} bgcolor={getPriorityBg(task.priority)}>
                                                                <Typography variant="body2" fontWeight={500} color={task.priority === 'high' ? 'error.main' : task.priority === 'medium' ? 'warning.main' : 'success.main'} noWrap>
                                                                    {task.task_name}
                                                                </Typography>
                                                                <Chip label="Outlook Task" size="small" color="info" sx={{ ml: 1 }} />
                                                            </Box>
                                                        ))}
                                                        {date && getItemsForDay(date).googleEvents.slice(0, 2).map(event => (
                                                            <Box key={`event-${event.id}`} mb={0.5} px={1} py={0.5} borderRadius={1} bgcolor="#e3f2fd">
                                                                <Typography variant="body2" fontWeight={500} color="primary.main" noWrap>
                                                                    {event.title} {/* Giữ title cho events */}
                                                                </Typography>
                                                                <Chip label="Google Calendar" size="small" color="primary" sx={{ ml: 1 }} />
                                                            </Box>
                                                        ))}
                                                        {date && getItemsForDay(date).outlookEvents.slice(0, 2).map(event => (
                                                            <Box key={`oevent-${event.id}`} mb={0.5} px={1} py={0.5} borderRadius={1} bgcolor="#e3f2fd">
                                                                <Typography variant="body2" fontWeight={500} color="info.main" noWrap>
                                                                    {event.title} {/* Giữ title cho events */}
                                                                </Typography>
                                                                <Chip label="Outlook Calendar" size="small" color="info" sx={{ ml: 1 }} />
                                                            </Box>
                                                        ))}
                                                        {date && getItemsForDay(date).eventModelEvents.slice(0, 2).map(event => (
                                                            <Box key={`emevent-${event.id}`} mb={0.5} px={1} py={0.5} borderRadius={1} bgcolor="#e3f2fd">
                                                                <Typography variant="body2" fontWeight={500} color="warning.main" noWrap>
                                                                    {event.title} {/* Giữ title cho events */}
                                                                </Typography>
                                                                <Chip label="Event" size="small" color="warning" sx={{ ml: 1 }} />
                                                            </Box>
                                                        ))}
                                                        {date && (getItemsForDay(date).localTasks.length + getItemsForDay(date).googleTasks.length + getItemsForDay(date).outlookTasks.length + getItemsForDay(date).googleEvents.length + getItemsForDay(date).outlookEvents.length + getItemsForDay(date).eventModelEvents.length) > 2 && <Typography variant="caption" color="text.secondary">+{(getItemsForDay(date).localTasks.length + getItemsForDay(date).googleTasks.length + getItemsForDay(date).outlookTasks.length + getItemsForDay(date).googleEvents.length + getItemsForDay(date).outlookEvents.length + getItemsForDay(date).eventModelEvents.length) - 2} thêm</Typography>}
                                                    </Box>
                                                </>
                                            )}
                                        </Paper>
                                    ))}
                                </Box>
                            );
                        })}
                    </Box>
                </>
            )}
            {renderDayDialog()}
            <Dialog open={showAddDialog} onClose={handleAddDialogClose} maxWidth="sm" fullWidth>
                <DialogTitle>Thêm công việc/sự kiện mới</DialogTitle>
                <DialogContent>
                    {addError && <Typography color="error" mb={1}>{addError}</Typography>}
                    <TextField
                        margin="dense"
                        label="Tên công việc"
                        name="task_name"
                        value={newTask.task_name}
                        onChange={handleNewTaskChange}
                        fullWidth
                        required
                    />
                    <TextField
                        margin="dense"
                        label="Mô tả"
                        name="description"
                        value={newTask.description}
                        onChange={handleNewTaskChange}
                        fullWidth
                        multiline
                        rows={2}
                    />
                    <TextField
                        margin="dense"
                        label="Bắt đầu"
                        name="start_time"
                        type="datetime-local"
                        value={newTask.start_time}
                        onChange={handleNewTaskChange}
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                        margin="dense"
                        label="Kết thúc"
                        name="end_time"
                        type="datetime-local"
                        value={newTask.end_time}
                        onChange={handleNewTaskChange}
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                        margin="dense"
                        label="Độ ưu tiên"
                        name="priority"
                        select
                        value={newTask.priority}
                        onChange={handleNewTaskChange}
                        fullWidth
                    >
                        <MenuItem value="low">Thấp</MenuItem>
                        <MenuItem value="medium">Trung bình</MenuItem>
                        <MenuItem value="high">Cao</MenuItem>
                    </TextField>
                    <TextField
                        margin="dense"
                        label="Trạng thái"
                        name="status"
                        select
                        value={newTask.status}
                        onChange={handleNewTaskChange}
                        fullWidth
                    >
                        <MenuItem value="pending">Đang chờ</MenuItem>
                        <MenuItem value="in_progress">Đang thực hiện</MenuItem>
                        <MenuItem value="completed">Đã hoàn thành</MenuItem>
                        <MenuItem value="cancelled">Đã hủy</MenuItem>
                    </TextField>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleAddDialogClose} disabled={addLoading}>Hủy</Button>
                    <Button variant="contained" onClick={handleAddTask} disabled={addLoading}>
                        {addLoading ? 'Đang lưu...' : 'Lưu'}
                    </Button>
                </DialogActions>
            </Dialog>
            {/* Global Sync Dialog */}
            <Dialog open={showGlobalSyncDialog} onClose={() => setShowGlobalSyncDialog(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Global Sync</DialogTitle>
                <DialogContent>
                    <Typography>
                        This button will sync <b>all the data currently showing on this website</b> to all the calendars you have synced to.<br/><br/>
                        Do you want to continue?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowGlobalSyncDialog(false)} disabled={globalSyncLoading}>Cancel</Button>
                    <Button 
                        variant="contained" 
                        color="primary" 
                        onClick={handleGlobalSync} 
                        disabled={globalSyncLoading}
                    >
                        {globalSyncLoading ? 'Syncing...' : 'Sync Now'}
                    </Button>
                </DialogActions>
            </Dialog>
            {showTodayTasks && ( // Dialog hiển thị danh sách công việc/sự kiện hôm nay
                <Dialog open={showTodayTasks} onClose={() => setShowTodayTasks(false)} maxWidth="sm" fullWidth>
                    <DialogTitle>Danh sách công việc hôm nay ({today.format('DD/MM/YYYY')})</DialogTitle>
                    <DialogContent>
                        <List>
                            {todayItems.localTasks.length === 0 && todayItems.googleTasks.length === 0 && todayItems.outlookTasks.length === 0 && todayItems.googleEvents.length === 0 && todayItems.outlookEvents.length === 0 && todayItems.eventModelEvents.length === 0 ? (
                                <ListItem>
                                    <ListItemText primary="Không có công việc hoặc sự kiện nào" />
                                </ListItem>
                            ) : (
                                <>
                                    {todayItems.localTasks.map(task => (
                                        <ListItem key={`task-${task.id}`}>
                                            <ListItemText
                                                primary={task.task_name}
                                                secondary={
                                                    <>
                                                        <Typography component="span" variant="body2" color="text.primary">{task.description}</Typography><br/>
                                                        <Typography component="span" variant="caption" color="text.secondary">{dayjs(task.due_date).format('HH:mm')} - {dayjs(task.end_time).format('HH:mm')}</Typography>
                                                    </>
                                                }
                                            />
                                            <Chip label={getStatusLabel(task.status)} size="small" color={getStatusColor(task.status)} sx={{ ml: 1 }} />
                                        </ListItem>
                                    ))}
                                    {todayItems.googleTasks.map(task => (
                                        <ListItem key={`gtask-${task.id}`}>
                                            <ListItemText
                                                primary={task.task_name}
                                                secondary={
                                                    <>
                                                        <Typography component="span" variant="body2" color="text.primary">{task.description}</Typography><br/>
                                                        <Typography component="span" variant="caption" color="text.secondary">{dayjs(task.due_date).format('HH:mm')}</Typography>
                                                    </>
                                                }
                                            />
                                            <Chip label="Google Task" size="small" color="success" sx={{ ml: 1 }} />
                                        </ListItem>
                                    ))}
                                    {todayItems.outlookTasks.map(task => (
                                        <ListItem key={`otask-${task.id}`}>
                                            <ListItemText
                                                primary={task.task_name}
                                                secondary={
                                                    <>
                                                        <Typography component="span" variant="body2" color="text.primary">{task.description}</Typography><br/>
                                                        <Typography component="span" variant="caption" color="text.secondary">
                                                            {dayjs(task.start_time).format('HH:mm')}
                                                        </Typography>
                                                    </>
                                                }
                                            />
                                            <Chip label="Outlook Task" size="small" color="info" sx={{ ml: 1 }} />
                                        </ListItem>
                                    ))}
                                    {todayItems.googleEvents.map(event => (
                                        <ListItem key={`event-${event.id}`}>
                                            <ListItemText
                                                primary={event.title}
                                                secondary={
                                                    <>
                                                        <Typography component="span" variant="body2" color="text.primary">{event.description}</Typography><br/>
                                                        <Typography component="span" variant="caption" color="text.secondary">{dayjs(event.start_time).format('HH:mm')} - {dayjs(event.end_time).format('HH:mm')}</Typography>
                                                    </>
                                                }
                                            />
                                            <Chip label="Google Calendar" size="small" color="primary" sx={{ ml: 1 }} />
                                        </ListItem>
                                    ))}
                                    {todayItems.outlookEvents.map(event => (
                                        <ListItem key={`oevent-${event.id}`}>
                                            <ListItemText
                                                primary={event.title} 
                                                secondary={
                                                    <>
                                                        <Typography component="span" variant="body2" color="text.primary">{event.description}</Typography><br/>
                                                        <Typography component="span" variant="caption" color="text.secondary">{dayjs(event.start_time).format('HH:mm')} - {dayjs(event.end_time).format('HH:mm')}</Typography>
                                                    </>
                                                }
                                            />
                                            <Chip label="Outlook Calendar" size="small" color="info" sx={{ ml: 1 }} />
                                        </ListItem>
                                    ))}
                                    {todayItems.eventModelEvents.map(event => (
                                        <ListItem key={`emevent-${event.id}`}>
                                            <ListItemText
                                                primary={event.title} 
                                                secondary={
                                                    <>
                                                        <Typography component="span" variant="body2" color="text.primary">{event.description}</Typography><br/>
                                                        <Typography component="span" variant="caption" color="text.secondary">{dayjs(event.start_time).format('HH:mm')} - {dayjs(event.end_time).format('HH:mm')}</Typography>
                                                    </>
                                                }
                                            />
                                            <Chip label="Event Model" size="small" color="warning" sx={{ ml: 1 }} />
                                        </ListItem>
                                    ))}
                                </>
                            )}
                        </List>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setShowTodayTasks(false)}>Đóng</Button>
                    </DialogActions>
                </Dialog>
            )}
        </Box>
    );
};

export default Calendar;