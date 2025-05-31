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
  firstName: Yup.string()
    .required('Không được để trống'),
  lastName: Yup.string()
    .required('Không được để trống'),
  email: Yup.string()
    .email('Email không hợp lệ')
    .required('Yêu cầu nhập email'),
  password: Yup.string()
    .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
    .required('Yêu cầu nhập mật khẩu'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Mật khẩu không khớp')
    .required('Yêu cầu nhập lại mật khẩu'),
});

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [error, setError] = useState('');

  const formik = useFormik({
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      setError('');
      const { confirmPassword, ...userData } = values;
      const result = await register(userData);
      if (result.success) {
        navigate('/');
      } else {
        setError(result.error);
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
            Đăng ký tài khoản mới
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
              {error}
            </Alert>
          )}
          <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 3, width: '100%' }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                required
                fullWidth
                id="firstName"
                label="First Name"
                name="firstName"
                autoComplete="given-name"
                value={formik.values.firstName}
                onChange={formik.handleChange}
                error={formik.touched.firstName && Boolean(formik.errors.firstName)}
                helperText={formik.touched.firstName && formik.errors.firstName}
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
                required
                fullWidth
                id="lastName"
                label="Last Name"
                name="lastName"
                autoComplete="family-name"
                value={formik.values.lastName}
                onChange={formik.handleChange}
                error={formik.touched.lastName && Boolean(formik.errors.lastName)}
                helperText={formik.touched.lastName && formik.errors.lastName}
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
            </Box>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email"
              name="email"
              autoComplete="email"
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
              autoComplete="new-password"
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
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Nhập lại mật khẩu"
              type="password"
              id="confirmPassword"
              value={formik.values.confirmPassword}
              onChange={formik.handleChange}
              error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
              helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
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
              disabled={formik.isSubmitting}
            >
              Đăng ký
            </Button>
            <Box sx={{ textAlign: 'center' }}>
              <Link component={RouterLink} to="/login" variant="body2" sx={{ color: '#4361ee', fontWeight: 500 }}>
                Đã có tài khoản? Đăng nhập
              </Link>
            </Box>
          </Box>
        </Box>
      </Container>
    </div>
  );
};

export default Register;