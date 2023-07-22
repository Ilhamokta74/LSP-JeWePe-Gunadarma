const email = document.getElementById('email');
const password = document.getElementById('password');
const btnSubmit = document.getElementById('submit');

btnSubmit.addEventListener('click', (submit) => {
    submit.preventDefault();
  
    if (email.value === '' && password.value === '') {
      alert('Please enter email and password');
      // Swal.fire({
      //   title: 'Error!',
      //   text: 'Please enter email and password',
      //   icon: 'error',
      //   confirmButtonText: 'OK'
      // });
    } else {
      alert('masuk woy');
      // Swal.fire({
      //   title: 'Success!',
      //   text: 'Signed in successfully',
      //   icon: 'success',
      // })
        // setTimeout(() => {
        //   window.location.href = '../views/home-admin.html';
        // }, 3000); // Timer akan mengarahkan pengguna ke halaman "home-admin.html" setelah 5 detik (5000 milidetik)
    }
  });
  