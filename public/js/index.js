/* eslint-disable */
import 'core-js/stable';
// import '@babel/polyfill';
import displayMap from './mapbox';
import axios from 'axios';

import { login, logout } from './login';
import { updateUserData } from './updateSettings';
import { bookTour } from './stripe';

//DOM
const mapBox = document.querySelector('#map');
const loginBtn = document.querySelector('#btn-login');
const logoutBtn = document.querySelector('#btn-logout');
const savePasswordBtn = document.querySelector('#btn-save-password');
const saveUserInfoBtn = document.querySelector('#btn-save-userInfo');
const forgetPasswordBtn = document.querySelector('#btn-forget-password');
const resetPasswordBtn = document.querySelector('#btn-reset-password');
const bookingBtn = document.querySelector('#btn-booking');

//VALUE
if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations);
  displayMap(locations);
}

if (loginBtn) {
  loginBtn.addEventListener('click', (e) => {
    e.preventDefault();
    //select form Dom Element
    const form = e.target.parentElement.parentElement;
    const userLoginData = {
      //user form values
      email: form.children[0].children[1].value,
      password: form.children[1].children[1].value,
    };

    login(userLoginData);
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener('click', (e) => {
    console.log('click');
    logout();
  });
}

if (savePasswordBtn) {
  savePasswordBtn.addEventListener('click', (e) => {
    e.preventDefault();
    savePasswordBtn.textContent = '更新中...';
    const returnValue = updateUserData('password');
    if (returnValue) savePasswordBtn.textContent = 'SAVE SETTINGS';
  });
}

if (saveUserInfoBtn) {
  saveUserInfoBtn.addEventListener('click', (e) => {
    e.preventDefault();
    saveUserInfoBtn.textContent = '更新中...';

    updateUserData('info');
  });
}

////////////////////////////////////////////////////

if (forgetPasswordBtn) {
  forgetPasswordBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const domain = 'http://127.0.0.1:6300';
    let email =
      forgetPasswordBtn.parentElement.parentElement.children[0].children[1]
        .value;
    (async () => {
      try {
        const res = await axios.post(`${domain}/api/v1/users/forgetPassword`, {
          email,
        });
        email = '';
        console.log(res);
        location.assign('/');
      } catch (err) {
        console.log(err.response.data.message);
      }
    })();
  });
}

if (resetPasswordBtn) {
  resetPasswordBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const domain = 'http://127.0.0.1:6300';
    const resetToken = window.location.pathname.split('/')[2];
    console.log(`Token ${window.location.pathname.split('/')[2]}`);

    //function(token)
    const resetFormGroup = document.querySelectorAll(
      '.reset-password .form__group'
    );

    const resetPasswordArr = [];
    resetFormGroup.forEach((group) => {
      if (group.children[1]) {
        resetPasswordArr.push(group.children[1].value);
      }
    });

    const resetPasswordData = {
      password: resetPasswordArr[0],
      passwordConfirm: resetPasswordArr[1],
    };

    (async () => {
      try {
        const res = await axios.post(
          `${domain}/api/v1/users/resetPassword/${resetToken}`,
          resetPasswordData
        );
        console.log(res);
        location.assign('/');
      } catch (err) {
        console.log(err.response.data.message);
      }
    })();

    //test data
    console.log(resetPasswordData);
  });
}

if (bookingBtn) {
  bookingBtn.addEventListener('click', () => {
    bookingBtn.textContent = '訂單處理中...';
    bookTour(bookingBtn.dataset.tourId);
  });
}
