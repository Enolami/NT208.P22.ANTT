import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Link,
  Alert,
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';

const validationSchema = Yup.object({
  email: Yup.string()
    .email('Email không hợp lệ')
    .required('Yêu cầu nhập email'),
  password: Yup.string()
    .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
    .required('Yêu cầu nhập mật khẩu'),
});

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      setError('');
      setIsLoading(true);
      try {
        const result = await login(values.email, values.password);
        if (!result.success) {
          setError(result.error);
        }
      } catch (err) {
        setError('Đã xảy ra lỗi khi đăng nhập. Vui lòng thử lại.');
      } finally {
        setIsLoading(false);
      }
    },
  });

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #e9f0ff 0%, #f8f9fa 100%)',
      display: 'flex',
      alignItems: 'center',
      fontFamily: "'Inter', sans-serif"
    }}>
      <Container component="main" maxWidth="xs">
        <Box
          sx={{
            background: '#fff',
            borderRadius: 4,
            boxShadow: '0 4px 24px #4361ee11',
            p: 4,
            mt: 6,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            fontFamily: "'Inter', sans-serif"
          }}
        >
          {/* Logo */}
          <Box sx={{ mb: 2 }}>
            <img src="/logo192.png" alt="TaskFlow" style={{ width: 54, borderRadius: 12, boxShadow: '0 2px 8px #4361ee22' }} />
          </Box>
          <Typography component="h1" variant="h5" sx={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, color: '#4361ee', mb: 1 }}>
            TaskFlow
          </Typography>
          <Typography sx={{ color: '#212529', fontWeight: 500, mb: 2 }}>
            Đăng nhập vào tài khoản của bạn
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
              {error}
            </Alert>
          )}
          <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 1, width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email"
              name="email"
              autoComplete="email"
              autoFocus
              value={formik.values.email}
              onChange={formik.handleChange}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
              sx={{
                background: '#f8f9fa',
                borderRadius: 2,
                boxShadow: '0 2px 8px #4361ee11',
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: '#e0e0e0' },
                  '&:hover fieldset': { borderColor: '#4361ee' },
                  '&.Mui-focused fieldset': { borderColor: '#4361ee' },
                },
                fontFamily: "'Inter', sans-serif"
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Mật khẩu"
              type="password"
              id="password"
              autoComplete="current-password"
              value={formik.values.password}
              onChange={formik.handleChange}
              error={formik.touched.password && Boolean(formik.errors.password)}
              helperText={formik.touched.password && formik.errors.password}
              sx={{
                background: '#f8f9fa',
                borderRadius: 2,
                boxShadow: '0 2px 8px #4361ee11',
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: '#e0e0e0' },
                  '&:hover fieldset': { borderColor: '#4361ee' },
                  '&.Mui-focused fieldset': { borderColor: '#4361ee' },
                },
                fontFamily: "'Inter', sans-serif"
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{
                mt: 3, mb: 2,
                background: '#4361ee',
                fontWeight: 700,
                fontFamily: "'Inter', sans-serif",
                borderRadius: 2,
                boxShadow: '0 2px 8px #4361ee22',
                '&:hover': { background: '#2746b6' }
              }}
              disabled={isLoading || formik.isSubmitting}
            >
              {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </Button>
            <Box sx={{ textAlign: 'center' }}>
              <Link component={RouterLink} to="/register" variant="body2" sx={{ color: '#4361ee', fontWeight: 500 }}>
                {"Không có tài khoản? Đăng ký"}
              </Link>
            </Box>
          </Box>
        </Box>
      </Container>
    </div>
  );
};

export default Login;