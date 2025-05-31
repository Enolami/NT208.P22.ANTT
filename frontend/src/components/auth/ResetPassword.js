import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

const validationSchema = Yup.object({
  password: Yup.string()
    .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
    .required('Yêu cầu nhập mật khẩu'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Mật khẩu không khớp')
    .required('Yêu cầu nhập lại mật khẩu'),
});

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { resetPasswordConfirm } = useAuth();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const token = searchParams.get('token');

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Liên kết không hợp lệ
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Liên kết không hợp lệ hoặc đã hết hạn.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const result = await resetPasswordConfirm(token, values.password);
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Đã xảy ra lỗi. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #e9f0ff 0%, #f8f9fa 100%)',
      display: 'flex',
      alignItems: 'center',
      fontFamily: "'Inter', sans-serif"
    }}>
      <div style={{
        maxWidth: 420,
        width: '100%',
        margin: '0 auto',
        background: '#fff',
        borderRadius: 16,
        boxShadow: '0 4px 24px #4361ee11',
        padding: 32
      }}>
        <h2 style={{ textAlign: 'center', fontWeight: 700, color: '#4361ee', fontFamily: "'Inter', sans-serif" }}>
          Đặt lại mật khẩu
        </h2>
        <Formik
          initialValues={{ password: '', confirmPassword: '' }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <Form style={{ marginTop: 24 }}>
              {error && (
                <div style={{ background: '#ffe5e5', color: '#e53935', borderRadius: 8, padding: 12, marginBottom: 12 }}>
                  {error}
                </div>
              )}
              {success && (
                <div style={{ background: '#e6ffed', color: '#06d6a0', borderRadius: 8, padding: 12, marginBottom: 12 }}>
                  Đặt lại mật khẩu thành công! Đang chuyển hướng đến đăng nhập...
                </div>
              )}
              <div>
                <Field
                  name="password"
                  type="password"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 8,
                    border: '1px solid #e0e0e0',
                    marginBottom: 8,
                    fontFamily: "'Inter', sans-serif"
                  }}
                  placeholder="Mật khẩu mới"
                />
                <ErrorMessage
                  name="password"
                  component="div"
                  style={{ color: '#e53935', fontSize: 14, marginBottom: 8 }}
                />
              </div>
              <div>
                <Field
                  name="confirmPassword"
                  type="password"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 8,
                    border: '1px solid #e0e0e0',
                    marginBottom: 8,
                    fontFamily: "'Inter', sans-serif"
                  }}
                  placeholder="Nhập lại mật khẩu mới"
                />
                <ErrorMessage
                  name="confirmPassword"
                  component="div"
                  style={{ color: '#e53935', fontSize: 14, marginBottom: 8 }}
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '12px 0',
                  background: '#4361ee',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 700,
                  fontFamily: "'Inter', sans-serif",
                  marginTop: 12,
                  boxShadow: '0 2px 8px #4361ee22',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer'
                }}
              >
                {isSubmitting ? 'Đang đặt lại...' : 'Đặt lại mật khẩu'}
              </button>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default ResetPassword;