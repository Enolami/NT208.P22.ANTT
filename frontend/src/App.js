import React, { useMemo, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Box, CssBaseline, ThemeProvider as MUIThemeProvider, createTheme, Toolbar, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useThemeContext } from './context/ThemeContext';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ProtectedRoute from './components/common/ProtectedRoute';
import TaskList from './components/tasks/TaskList';
import Calendar from './components/calendar/Calendar';
import Navigation from './components/common/Navigation';
import CalendarSync from './components/calendar/CalendarSync';
import EventList from './components/events/EventList';
import AIAssistant from './components/ai/AIAssistant';

// Define the design tokens for light and dark mode
const getDesignTokens = (mode) => ({
  palette: {
    mode,
    primary: {
      main: '#4361ee',
    },
    secondary: {
      main: '#06d6a0',
    },
    background: {
      default: mode === 'dark' ? '#23272f' : '#f8f9fa',
      paper: mode === 'dark' ? '#23272f' : '#fff',
    },
    text: {
      primary: mode === 'dark' ? '#f8f9fa' : '#212529',
      secondary: mode === 'dark' ? '#b0b0b0' : '#6c757d',
    },
  },
  typography: {
    fontFamily: "'Quicksand', Arial, sans-serif",
    h1: { fontSize: '2rem', fontWeight: 700 },
    h2: { fontSize: '1.75rem', fontWeight: 700 },
    h3: { fontSize: '1.5rem', fontWeight: 700 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
  },
});

const MainApp = () => {
  const { user, logout } = useAuth();
  const theme = useTheme();
  const [activeTab, setActiveTab] = React.useState('tasks'); // Ensure React.useState is used
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      minHeight: '100vh',
      flexDirection: { xs: 'column', sm: 'row' }
    }}>
      <Navigation 
        activeTab={activeTab} 
        onTabChange={handleTabChange} 
        isMobile={isMobile}
      />
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          width: { xs: '100%', sm: 'auto' },
          mt: { xs: isMobile ? '56px' : 0, sm: 0 }
        }}
      >
        <Toolbar />
        {activeTab === 'tasks' && <TaskList />}
        {activeTab === 'calendar' && <Calendar />}
        {activeTab === 'sync' && <CalendarSync />}
        {activeTab === 'events' && <EventList />}
        {activeTab === 'ai' && <AIAssistant />}
      </Box>
    </Box>
  );
};

function App() {
  const { darkMode } = useThemeContext();
  const muiTheme = useMemo(() => createTheme(getDesignTokens(darkMode ? 'dark' : 'light')), [darkMode]);

  // Set background for body according to theme
  useEffect(() => {
    document.body.style.background = darkMode
      ? '#23272f'
      : '#f8f9fa';
  }, [darkMode]);

  return (
    <MUIThemeProvider theme={muiTheme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          background: muiTheme.palette.background.default,
          transition: 'background 0.3s'
        }}
      >
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
      </Box>
    </MUIThemeProvider>
  );
}

export default App;
