import axios from 'axios';
import { showAlert } from './alert';
import { logout } from './login';

//updata(type)

export const updateUserData = async (type) => {
  let apiUrl = '';
  let data = {};

  //data
  if (type === 'password') {
    apiUrl = `api/v1/users/updatePassword`;
    data = {
      currentPassword: document.querySelector('#password-current').value,
      password: document.querySelector('#password').value,
      passwordConfirm: document.querySelector('#password-confirm').value,
    };
  }
  if (type === 'info') {
    const form = new FormData();
    form.append('name', document.querySelector('#name').value);
    form.append('email', document.querySelector('#email').value);
    form.append('photo', document.querySelector('#photo').files[0]);

    apiUrl = `/api/v1/users/updateOwnInfo`;
    data = form;
  }

  try {
    const res = await axios.patch(apiUrl, data);
    if (res.status === 200) {
      showAlert('success', '更新成功！');
      setTimeout(() => location.assign(`/profile`), 2000);
    }
    return res;
  } catch (error) {
    showAlert('error', `${error.response.data.message}`);
    return error.response.data.message;
  }
};
