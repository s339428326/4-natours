import axios from 'axios';
import { showAlert } from './alert';
import { logout } from './login';

//updata(type)

export const updateUserData = async (type) => {
  const domain = 'http://127.0.0.1:6300';
  let apiUrl = '';
  let data = {};

  //data
  if (type === 'password') {
    apiUrl = `${domain}/api/v1/users/updatePassword`;
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
    console.log(form);

    apiUrl = `${domain}/api/v1/users/updateOwnInfo`;
    data = form;
    console.log(data);
  }

  try {
    const res = await axios.patch(apiUrl, data);
    if (res.status === 200) {
      console.log(res);
      showAlert('success', '更新成功！');
      setTimeout(() => location.assign(`/profile`), 2000);
    }
    return res;
  } catch (error) {
    showAlert('error', `${error.response.data.message}`);
    return error.response.data.message;
  }
};