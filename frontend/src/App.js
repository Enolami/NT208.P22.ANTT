import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Box, CssBaseline, ThemeProvider, createTheme, Toolbar } from '@mui/material';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ProtectedRoute from './components/common/ProtectedRoute';
import TaskList from './components/tasks/TaskList';
import Calendar from './components/Calendar';
import Navigation from './components/common/Navigation';
import CalendarSync from './components/CalendarSync';
import EventList from './components/events/EventList';
// Create theme instance
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const MainApp = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('tasks');

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Navigation activeTab={activeTab} onTabChange={handleTabChange} />
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        {activeTab === 'tasks' && <TaskList />}
        {activeTab === 'calendar' && <Calendar />}
        {activeTab === 'sync' && <CalendarSync />}
        {activeTab === 'events' && <EventList />}
      </Box>
    </Box>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <MainApp />
                </ProtectedRoute>
              }
          />
          </Routes>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
