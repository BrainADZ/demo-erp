import * as actionTypes from './types';
import * as authService from '@/auth';
import { request } from '@/request';

export const login =
  ({ loginData }) =>
  async (dispatch) => {
    dispatch({
      type: actionTypes.REQUEST_LOADING,
    });
    const data = await authService.login({ loginData });

    if (data.success === true) {
      const auth_state = {
        current: data.result,
        isLoggedIn: true,
        isLoading: false,
        isSuccess: true,
      };
      window.localStorage.setItem('auth', JSON.stringify(auth_state));
      window.localStorage.removeItem('isLogout');
      dispatch({
        type: actionTypes.REQUEST_SUCCESS,
        payload: data.result,
      });
    } else {
      dispatch({
        type: actionTypes.REQUEST_FAILED,
      });
    }
  };

export const register =
  ({ registerData }) =>
  async (dispatch) => {
    dispatch({
      type: actionTypes.REQUEST_LOADING,
    });
    const data = await authService.register({ registerData });

    if (data.success === true) {
      dispatch({
        type: actionTypes.REGISTER_SUCCESS,
      });
    } else {
      dispatch({
        type: actionTypes.REQUEST_FAILED,
      });
    }
  };

export const verify =
  ({ userId, emailToken }) =>
  async (dispatch) => {
    dispatch({
      type: actionTypes.REQUEST_LOADING,
    });
    const data = await authService.verify({ userId, emailToken });

    if (data.success === true) {
      const auth_state = {
        current: data.result,
        isLoggedIn: true,
        isLoading: false,
        isSuccess: true,
      };
      window.localStorage.setItem('auth', JSON.stringify(auth_state));
      window.localStorage.removeItem('isLogout');
      dispatch({
        type: actionTypes.REQUEST_SUCCESS,
        payload: data.result,
      });
    } else {
      dispatch({
        type: actionTypes.REQUEST_FAILED,
      });
    }
  };

export const resetPassword =
  ({ resetPasswordData }) =>
  async (dispatch) => {
    dispatch({
      type: actionTypes.REQUEST_LOADING,
    });
    const data = await authService.resetPassword({ resetPasswordData });

    if (data.success === true) {
      const auth_state = {
        current: data.result,
        isLoggedIn: true,
        isLoading: false,
        isSuccess: true,
      };
      window.localStorage.setItem('auth', JSON.stringify(auth_state));
      window.localStorage.removeItem('isLogout');
      dispatch({
        type: actionTypes.REQUEST_SUCCESS,
        payload: data.result,
      });
    } else {
      dispatch({
        type: actionTypes.REQUEST_FAILED,
      });
    }
  };

export const logout = () => async (dispatch) => {
  const result = window.localStorage.getItem('auth');
  const tmpAuth = result ? JSON.parse(result) : null;
  const settings = window.localStorage.getItem('settings');
  const tmpSettings = settings ? JSON.parse(settings) : null;
  const token = tmpAuth?.current?.token;

  window.localStorage.setItem('isLogout', JSON.stringify({ isLogout: true }));
  const data = token ? await authService.logout({ token }) : { success: true };

  if (data.success === false && !data.jwtExpired) {
    const auth_state = {
      current: tmpAuth?.current,
      isLoggedIn: true,
      isLoading: false,
      isSuccess: true,
    };
    if (tmpAuth?.current) {
      window.localStorage.setItem('auth', JSON.stringify(auth_state));
    }
    if (tmpSettings) {
      window.localStorage.setItem('settings', JSON.stringify(tmpSettings));
    }
    window.localStorage.removeItem('isLogout');
    dispatch({
      type: actionTypes.LOGOUT_FAILED,
      payload: data.result,
    });
  } else {
    window.localStorage.removeItem('auth');
    window.localStorage.removeItem('settings');
    dispatch({
      type: actionTypes.LOGOUT_SUCCESS,
    });
  }
};

export const updateProfile =
  ({ entity, jsonData }) =>
  async (dispatch) => {
    let data = await request.updateAndUpload({ entity, id: '', jsonData });

    if (data.success === true) {
      dispatch({
        type: actionTypes.REQUEST_SUCCESS,
        payload: data.result,
      });
      const auth_state = {
        current: data.result,
        isLoggedIn: true,
        isLoading: false,
        isSuccess: true,
      };
      window.localStorage.setItem('auth', JSON.stringify(auth_state));
    }
  };
