/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alert';

export async function login(data) {
  const domain = 'http://127.0.0.1:6300/';
  try {
    //   console.log(JSON.stringify(data));
    const res = await axios.post(`${domain}api/v1/users/login`, data);
    console.log(res);
    if (res.status === 200) {
      showAlert('success', '登入成功 ！');
      //to '/'
      setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    // console.log(err.response.data);
    console.log(err);
    showAlert('error', `登入失敗 !\n, ${err.response.data.message}`);
  }
}

export async function logout() {
  const domain = 'http://127.0.0.1:6300/';
  try {
    const res = await axios.get(`${domain}api/v1/users/logout`);
    location.assign('/');
  } catch (err) {
    showAlert('error', `登入失敗 !, 請重新嘗試`);
  }
}
