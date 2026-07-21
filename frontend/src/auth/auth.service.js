import { API_BASE_URL } from '@/config/serverApiConfig';

import axios from 'axios';
import errorHandler from '@/request/errorHandler';
import successHandler from '@/request/successHandler';

const detectBrowser = () => {
  const ua = navigator.userAgent || '';
  if (/Edg/i.test(ua)) return 'Edge';
  if (/OPR|Opera/i.test(ua)) return 'Opera';
  if (/Chrome/i.test(ua)) return 'Chrome';
  if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) return 'Safari';
  if (/Firefox/i.test(ua)) return 'Firefox';
  return 'Unknown';
};

const getClientContext = () => {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

  return {
    browser: detectBrowser(),
    os: navigator.platform || '',
    deviceType: /Mobile/i.test(navigator.userAgent)
      ? 'Mobile'
      : /Tablet|iPad/i.test(navigator.userAgent)
      ? 'Tablet'
      : 'Desktop',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
    language: navigator.language || '',
    screen: `${window.screen?.width || 0}x${window.screen?.height || 0}`,
    network: connection?.effectiveType || '',
    workModeHint: navigator.onLine ? '' : 'remote',
  };
};

export const login = async ({ loginData }) => {
  try {
    const response = await axios.post(
      API_BASE_URL + `login?timestamp=${new Date().getTime()}`,
      { ...loginData, clientContext: getClientContext() }
    );

    const { status, data } = response;

    successHandler(
      { data, status },
      {
        notifyOnSuccess: false,
        notifyOnFailed: true,
      }
    );
    return data;
  } catch (error) {
    return errorHandler(error);
  }
};

export const register = async ({ registerData }) => {
  try {
    const response = await axios.post(API_BASE_URL + `register`, registerData);

    const { status, data } = response;

    successHandler(
      { data, status },
      {
        notifyOnSuccess: true,
        notifyOnFailed: true,
      }
    );
    return data;
  } catch (error) {
    return errorHandler(error);
  }
};

export const verify = async ({ userId, emailToken }) => {
  try {
    const response = await axios.get(API_BASE_URL + `verify/${userId}/${emailToken}`);

    const { status, data } = response;

    successHandler(
      { data, status },
      {
        notifyOnSuccess: true,
        notifyOnFailed: true,
      }
    );
    return data;
  } catch (error) {
    return errorHandler(error);
  }
};

export const resetPassword = async ({ resetPasswordData }) => {
  try {
    const response = await axios.post(API_BASE_URL + `resetpassword`, resetPasswordData);

    const { status, data } = response;

    successHandler(
      { data, status },
      {
        notifyOnSuccess: true,
        notifyOnFailed: true,
      }
    );
    return data;
  } catch (error) {
    return errorHandler(error);
  }
};
export const logout = async ({ token } = {}) => {
  axios.defaults.withCredentials = true;
  try {
    const response = await axios.post(
      API_BASE_URL + `logout?timestamp=${new Date().getTime()}`,
      { clientContext: getClientContext() },
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      }
    );
    const { status, data } = response;

    successHandler(
      { data, status },
      {
        notifyOnSuccess: false,
        notifyOnFailed: true,
      }
    );
    return data;
  } catch (error) {
    return errorHandler(error);
  }
};
