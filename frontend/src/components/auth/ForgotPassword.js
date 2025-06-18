import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
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
});

const ForgotPassword = () => {
  const { resetPassword } = useAuth();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const formik = useFormik({
    initialValues: {
      email: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      setError('');
      setSuccess(false);
      const result = await resetPassword(values.email);
      if (result.success) {
        setSuccess(true);
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
          <Typography component="h1" variant="h5" sx={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, color: '#4361ee', mb: 1 }}>
            Quên mật khẩu?
          </Typography>
          <Typography sx={{ color: '#212529', fontWeight: 500, mb: 2 }}>
            Nhập email để nhận hướng dẫn đặt lại mật khẩu
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mt: 2, width: '100%' }}>
              Hướng dẫn đặt lại mật khẩu đã được gửi đến email của bạn.
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
              Gửi hướng dẫn đặt lại mật khẩu
            </Button>
            <Box sx={{ textAlign: 'center' }}>
              <Link component={RouterLink} to="/login" variant="body2" sx={{ color: '#4361ee', fontWeight: 500 }}>
                Quay lại đăng nhập
              </Link>
            </Box>
          </Box>
        </Box>
      </Container>
    </div>
  );
};

export default ForgotPassword;