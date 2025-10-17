'use client'
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Link from "next/link";
import { useState } from 'react';

import CustomFormLabel from "@/app/components/forms/theme-elements/CustomFormLabel";
import CustomTextField from "@/app/components/forms/theme-elements/CustomTextField";
import { useAuth } from '@/app/context/AuthContext';

export default function AuthForgotPassword(){
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await resetPassword(email);
      setMessage('Password reset email sent! Please check your inbox.');
    } catch (error: any) {
      setError(error.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack mt={4} spacing={2} component="form" onSubmit={handleSubmit}>
        <CustomFormLabel htmlFor="reset-email">Email Address</CustomFormLabel>
        <CustomTextField 
          id="reset-email" 
          variant="outlined" 
          fullWidth 
          type="email"
          value={email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
          required
          disabled={loading}
        />

        {message && (
          <Alert severity="success">
            {message}
          </Alert>
        )}

        {error && (
          <Alert severity="error">
            {error}
          </Alert>
        )}

        <Button
          color="primary"
          variant="contained"
          size="large"
          fullWidth
          type="submit"
          disabled={loading || !email}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Sending...' : 'Send Reset Email'}
        </Button>
        <Button
          color="primary"
          size="large"
          fullWidth
          component={Link}
          href="/auth/login"
          disabled={loading}
        >
          Back to Login
        </Button>
      </Stack>
    </>
  );
};
