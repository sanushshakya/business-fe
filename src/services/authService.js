// src/services/authService.js

import axios from '../utils/axios';
import useAuthStore from '../stores/authStore';

/**
 * Logs in with an email and password. Stores the token pair, unless the server asks for a second step
 * (two-factor): then nothing is stored and the challenge is returned for `verifyTwoFactor` / enrolment.
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<null | {step: 'verify' | 'enrol', challenge: string}>}
 */
export const login = async (email, password) => {
  // A new sign-in replaces whoever was signed in here, so their token is not sent with this person's set-up calls.
  useAuthStore.getState().clearTokens();
  const { data } = await axios.post('/auth/login/', { username: email, password });
  if (data.two_factor) return { step: data.two_factor, challenge: data.challenge };
  useAuthStore.getState().setTokens(data);
  return null;
};

/**
 * Second sign-in step: a 6-digit code (spaces ignored) or a recovery code. Stores the token pair.
 *
 * @param {string} challenge
 * @param {{code?: string, recoveryCode?: string}} answer
 */
export const verifyTwoFactor = async (challenge, { code, recoveryCode }) => {
  const body = recoveryCode ? { challenge, recovery_code: recoveryCode } : { challenge, code: code.replace(/\s/g, '') };
  const { data } = await axios.post('/auth/2fa/verify/', body);
  useAuthStore.getState().setTokens(data);
};

/**
 * Starts setting up an authenticator app: `{secret, otpauth_uri, qr_svg}`. Pass the sign-in challenge when an
 * admin must set it up before signing in; leave it out when already signed in.
 */
export const startEnrolment = async (challenge) => {
  const { data } = challenge
    ? await axios.post('/auth/2fa/enrol/', { challenge }, { skipAuthRefresh: true })
    : await axios.post('/auth/2fa/enrol/', {});
  return data;
};

/**
 * Confirms the set-up with a code from the app and returns the 10 recovery codes. When done with a sign-in
 * challenge the server also sends the token pair, which is stored.
 */
export const confirmEnrolment = async (code, challenge) => {
  const body = { ...(challenge ? { challenge } : {}), code: code.replace(/\s/g, '') };
  const { data } = challenge
    ? await axios.post('/auth/2fa/enrol/confirm/', body, { skipAuthRefresh: true })
    : await axios.post('/auth/2fa/enrol/confirm/', body);
  if (data.access_token) useAuthStore.getState().setTokens(data);
  return data.recovery_codes;
};

/**
 * Signs an operator (till, demand, freight, ...) in with their 8-digit code and stores the returned token pair.
 *
 * @param {string} code
 * @returns {Promise<void>}
 */
export const loginWithCode = async (code) => {
  const response = await axios.post('/auth/code-login/', { code });
  useAuthStore.getState().setTokens(response.data);
};

/**
 * Revokes the session on the server (best effort) and clears local tokens.
 */
export const logout = async () => {
  const { refreshToken, clearTokens } = useAuthStore.getState();
  try {
    if (refreshToken) await axios.post('/auth/logout/', { refresh_token: refreshToken });
  } catch {
    // The session is cleared locally regardless.
  } finally {
    clearTokens();
  }
};

export const isAuthenticated = () => Boolean(useAuthStore.getState().accessToken);

export default { login, loginWithCode, verifyTwoFactor, startEnrolment, confirmEnrolment, logout, isAuthenticated };
