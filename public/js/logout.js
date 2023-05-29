/* eslint-disable */
const logoutBtn = document.querySelector('#btn-logout');

logoutBtn.addEventListener('click', () => {
  e.parentDefault();
  console.log('out');
  let time = new Date();
  time.setTime(time.getTime() - 1);
  let cookieValue = getCookie('jwt');
  if (cookieValue != null) {
    document.cookie = 'jwt' + '=' + ';expires=' + time.toGMTString();
  }
});
