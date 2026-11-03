(function () {
  'use strict';

  // Menu mobile
  var toggle = document.getElementById('navToggle');
  var menu = document.getElementById('navMenu');
  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      var open = menu.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  // Konfirmasi aksi berbahaya (SweetAlert2, fallback ke confirm())
  document.addEventListener('submit', function (e) {
    var form = e.target;
    if (!form.dataset || !form.dataset.confirm || form.dataset.confirmed) return;
    e.preventDefault();
    var go = function () { form.dataset.confirmed = '1'; form.submit(); };
    if (window.Swal) {
      var danger = 'danger' in form.dataset;
      Swal.fire({
        title: 'Yakin?',
        text: form.dataset.confirm,
        icon: danger ? 'warning' : 'question',
        showCancelButton: true,
        confirmButtonText: form.dataset.confirmOk || 'Ya',
        cancelButtonText: 'Batal',
        confirmButtonColor: danger ? '#dc2626' : '#4338ca',
        reverseButtons: true
      }).then(function (r) { if (r.isConfirmed) go(); });
    } else if (window.confirm(form.dataset.confirm)) {
      go();
    }
  });

  // Tampilkan / sembunyikan password
  document.querySelectorAll('[data-toggle-pw]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var input = btn.parentElement.querySelector('input');
      var show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.textContent = show ? 'Sembunyi' : 'Lihat';
    });
  });

  // Penghitung karakter
  document.querySelectorAll('[data-counter]').forEach(function (ta) {
    var out = ta.parentElement.querySelector('.counter');
    var max = ta.maxLength;
    var upd = function () { if (out) out.textContent = ta.value.length + ' / ' + max; };
    ta.addEventListener('input', upd); upd();
  });

  // Pratinjau gambar + batas 5 MB
  document.querySelectorAll('input[type=file][data-preview]').forEach(function (inp) {
    var img = document.querySelector(inp.dataset.preview);
    inp.addEventListener('change', function () {
      var f = inp.files && inp.files[0];
      if (!f) return;
      if (f.size > 5 * 1024 * 1024) {
        alert('Ukuran gambar maksimal 5 MB.');
        inp.value = '';
        return;
      }
      if (img) { img.src = URL.createObjectURL(f); img.hidden = false; }
    });
  });

  // Filter tabel admin
  var filter = document.getElementById('tableFilter');
  var rows = document.querySelectorAll('#artikelTable tbody tr');
  if (filter) {
    filter.addEventListener('input', function () {
      var q = filter.value.toLowerCase();
      rows.forEach(function (r) { r.style.display = r.textContent.toLowerCase().indexOf(q) > -1 ? '' : 'none'; });
    });
  }
})();
