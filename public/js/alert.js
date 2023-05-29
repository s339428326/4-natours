/* eslint-disable */
export const closeAlert = () => {
  const alert = document.querySelector('.alert');
  if (alert) document.querySelector('body').removeChild(alert);
};

//type:success, error
export const showAlert = (type, msg) => {
  const alert = `<div class="alert alert--${type}">${msg}</div>`;
  document.querySelector('body').insertAdjacentHTML('afterbegin', alert);
  setTimeout(closeAlert, 3000);
};
