/* SPA Router + Views + CRUD (mobile-first) */
(function(){
  const app = document.getElementById('app');
  const sideNav = document.getElementById('sideNav');
  const btnMenu = document.getElementById('btnMenu');

  btnMenu?.addEventListener('click', () => sideNav.classList.toggle('hidden'));
  window.addEventListener('hashchange', render);
  document.addEventListener('click', (e)=>{
    const link = e.target.closest('a.nav-link');
    if (link) sideNav.classList.add('hidden');
  });

  const routes = {
    '#/dashboard': viewDashboard,
    '#/login': viewLogin,
    '#/supplier': viewSupplier,
    '#/pembelian-ayam': viewPembelianAyam,
    '#/pembelian-bahan': viewPembelianBahan,
    '#/penjualan': viewPenjualan,
    '#/pengaturan': viewPengaturan,
  };

  function requireAuth(to) {
    if (to === '#/login' || to === '#/dashboard') return true;
    const auth = sessionStorage.getItem(Store.key('auth'));
    if (!auth) { location.hash = '#/login'; return false; }
    return true;
  }

  function setActiveNav() {
    const cur = location.hash || '#/dashboard';
    sideNav.querySelectorAll('.nav-link').forEach(a => {
      if (a.getAttribute('href') === cur) a.classList.add('active');
      else a.classList.remove('active');
    });
  }

  async function render() {
    const to = location.hash || '#/dashboard';
    if (!routes[to]) { location.hash = '#/dashboard'; return; }
    if (!requireAuth(to)) return;
    setActiveNav();
    await routes[to]();
  }

  /* Utilities */
  const fmt = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 });
  const rupiah = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
  const $ = (sel, el=document) => el.querySelector(sel);
  const $$ = (sel, el=document) => Array.from(el.querySelectorAll(sel));

  function tpl(id) { return document.getElementById(id).content.cloneNode(true); }

  /* Views */
  function viewLogin() {
    app.innerHTML = '';
    app.appendChild(tpl('tpl-login'));
    const form = document.getElementById('formLogin');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const username = fd.get('username').toString().trim();
      const password = fd.get('password').toString();
      const data = Store.load();
      const user = data.users.find(u => u.username === username);
      if (!user) return alert('User tidak ditemukan');
      const hash = await Store.sha256Hex(password);
      if (hash !== user.passwordSha256) return alert('Password salah');
      sessionStorage.setItem(Store.key('auth'), JSON.stringify({ id: user.id, username: user.username }));
      location.hash = '#/dashboard';
    });
  }

  function viewDashboard() {
    const data = Store.load();
    app.innerHTML = '';
    app.appendChild(tpl('tpl-dashboard'));
    const totalBeratMasuk = data.pembelianAyam.reduce((s, it) => s + Number(it.totalBeratKg||0), 0);
    const totalBeratTerjual = data.penjualan.reduce((s, it) => s + Number(it.beratTerjualKg||0), 0);
    const stokTersisa = Math.max(0, totalBeratMasuk - totalBeratTerjual);
    const totalPembelianAyam = data.pembelianAyam.reduce((s, it) => s + (Number(it.hargaPerEkor||0) * Number(it.jumlahEkor||0) || Number(it.totalHarga||0)), 0);
    const totalPembelianBahan = data.pembelianBahan.reduce((s, it) => s + (Number(it.hargaPerSatuan||0) * Number(it.jumlah||0)), 0);
    const totalPenjualan = data.penjualan.reduce((s, it) => s + (Number(it.hargaJualPerKg||0) * Number(it.beratTerjualKg||0)), 0);
    const labaRugi = totalPenjualan - (totalPembelianAyam + totalPembelianBahan);

    $('[data-id="sumBeratMasuk"]').textContent = fmt.format(totalBeratMasuk);
    $('[data-id="stokTersisa"]').textContent = fmt.format(stokTersisa);
    $('[data-id="sumPembelianAyam"]').textContent = rupiah.format(totalPembelianAyam);
    $('[data-id="sumPembelianBahan"]').textContent = rupiah.format(totalPembelianBahan);
    $('[data-id="sumPenjualan"]').textContent = rupiah.format(totalPenjualan);
    $('[data-id="labaRugi"]').textContent = rupiah.format(labaRugi);
  }

  function bindRowButtons(tbody, onEdit, onDelete) {
    tbody.addEventListener('click', (e)=>{
      const btn = e.target.closest('button[data-id]');
      if (!btn) return;
      const id = btn.getAttribute('data-id');
      if (btn.dataset.action === 'edit') onEdit(id);
      else if (btn.dataset.action === 'delete') onDelete(id);
    });
  }

  function viewSupplier() {
    const data = Store.load();
    app.innerHTML = '';
    app.appendChild(tpl('tpl-supplier'));
    const form = document.getElementById('formSupplier');
    const tbody = document.querySelector('[data-table="supplier"] tbody');

    function renderRows() {
      const rows = Store.load().suppliers.map(s => `
        <tr>
          <td>${s.nama||''}</td>
          <td>${s.kontak||''}</td>
          <td>
            <div class="row-actions">
              <button class="btn" data-action="edit" data-id="${s.id}">Edit</button>
              <button class="btn danger" data-action="delete" data-id="${s.id}">Hapus</button>
            </div>
          </td>
        </tr>`).join('');
      tbody.innerHTML = rows || '<tr><td colspan="3" class="muted">Belum ada data</td></tr>';
    }

    renderRows();
    bindRowButtons(tbody, (id)=>{
      const item = Store.load().suppliers.find(x=>x.id===id);
      if (!item) return;
      form.id.value = item.id;
      form.nama.value = item.nama||'';
      form.kontak.value = item.kontak||'';
      form.nama.focus();
    }, (id)=>{
      const d = Store.load();
      d.suppliers = d.suppliers.filter(x=>x.id!==id);
      Store.save(d);
      renderRows();
    });

    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      const d = Store.load();
      const fd = new FormData(form);
      const payload = {
        id: fd.get('id')?.toString() || Store.uid('sup'),
        nama: fd.get('nama')?.toString().trim(),
        kontak: fd.get('kontak')?.toString().trim(),
      };
      const idx = d.suppliers.findIndex(x=>x.id===payload.id);
      if (idx>=0) d.suppliers[idx] = payload; else d.suppliers.push(payload);
      Store.save(d);
      form.reset();
      renderRows();
    });
  }

  function fillSupplierOptions(select) {
    const data = Store.load();
    select.innerHTML = '<option value="" disabled selected>Pilih…</option>' + data.suppliers.map(s=>`<option value="${s.nama}">${s.nama}</option>`).join('');
  }

  function viewPembelianAyam() {
    app.innerHTML = '';
    app.appendChild(tpl('tpl-pembelian-ayam'));
    const form = document.getElementById('formPembelianAyam');
    const tbody = document.querySelector('[data-table="pembelianAyam"] tbody');
    fillSupplierOptions(form.supplier);

    function totalHarga(row) {
      const byEkor = Number(row.hargaPerEkor||0) * Number(row.jumlahEkor||0);
      const byKg = Number(row.hargaPerKg||0) * Number(row.totalBeratKg||0);
      return byEkor || byKg || 0;
    }

    function renderRows() {
      const rows = Store.load().pembelianAyam.map(it => {
        const total = it.totalHarga ?? totalHarga(it);
        return `
        <tr>
          <td>${it.tanggal||''}</td>
          <td>${it.supplier||''}</td>
          <td>${fmt.format(Number(it.jumlahEkor||0))}</td>
          <td>${fmt.format(Number(it.totalBeratKg||0))}</td>
          <td>${rupiah.format(Number(it.hargaPerEkor||0))}</td>
          <td>${rupiah.format(Number(it.hargaPerKg||0))}</td>
          <td>${rupiah.format(Number(total||0))}</td>
          <td>
            <div class="row-actions">
              <button class="btn" data-action="edit" data-id="${it.id}">Edit</button>
              <button class="btn danger" data-action="delete" data-id="${it.id}">Hapus</button>
            </div>
          </td>
        </tr>`;
      }).join('');
      tbody.innerHTML = rows || '<tr><td colspan="8" class="muted">Belum ada data</td></tr>';
    }

    renderRows();
    bindRowButtons(tbody, (id)=>{
      const item = Store.load().pembelianAyam.find(x=>x.id===id);
      if (!item) return;
      form.id.value = item.id; form.tanggal.value = item.tanggal||''; form.supplier.value = item.supplier||'';
      form.jumlahEkor.value = item.jumlahEkor||''; form.totalBeratKg.value = item.totalBeratKg||''; form.hargaPerEkor.value = item.hargaPerEkor||''; form.hargaPerKg.value = item.hargaPerKg||''; form.catatan.value = item.catatan||'';
      form.tanggal.focus();
    }, (id)=>{
      const d = Store.load();
      d.pembelianAyam = d.pembelianAyam.filter(x=>x.id!==id);
      Store.save(d);
      renderRows();
    });

    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      const d = Store.load();
      const fd = new FormData(form);
      const payload = {
        id: fd.get('id')?.toString() || Store.uid('buy'),
        tanggal: fd.get('tanggal')?.toString(),
        supplier: fd.get('supplier')?.toString(),
        jumlahEkor: Number(fd.get('jumlahEkor')||0),
        totalBeratKg: Number(fd.get('totalBeratKg')||0),
        hargaPerEkor: Number(fd.get('hargaPerEkor')||0),
        hargaPerKg: Number(fd.get('hargaPerKg')||0),
        totalHarga: undefined,
        catatan: fd.get('catatan')?.toString()||'',
      };
      const idx = d.pembelianAyam.findIndex(x=>x.id===payload.id);
      if (idx>=0) d.pembelianAyam[idx] = payload; else d.pembelianAyam.push(payload);
      Store.save(d);
      form.reset(); fillSupplierOptions(form.supplier); renderRows();
    });
  }

  function viewPembelianBahan() {
    app.innerHTML = '';
    app.appendChild(tpl('tpl-pembelian-bahan'));
    const form = document.getElementById('formPembelianBahan');
    const tbody = document.querySelector('[data-table="pembelianBahan"] tbody');

    function renderRows() {
      const rows = Store.load().pembelianBahan.map(it => {
        const total = Number(it.hargaPerSatuan||0) * Number(it.jumlah||0);
        return `
        <tr>
          <td>${it.tanggal||''}</td>
          <td>${it.item||''}</td>
          <td>${fmt.format(Number(it.jumlah||0))}</td>
          <td>${it.satuan||''}</td>
          <td>${rupiah.format(Number(it.hargaPerSatuan||0))}</td>
          <td>${rupiah.format(total)}</td>
          <td>
            <div class="row-actions">
              <button class="btn" data-action="edit" data-id="${it.id}">Edit</button>
              <button class="btn danger" data-action="delete" data-id="${it.id}">Hapus</button>
            </div>
          </td>
        </tr>`;
      }).join('');
      tbody.innerHTML = rows || '<tr><td colspan="7" class="muted">Belum ada data</td></tr>';
    }

    renderRows();
    bindRowButtons(tbody, (id)=>{
      const item = Store.load().pembelianBahan.find(x=>x.id===id);
      if (!item) return;
      form.id.value = item.id; form.tanggal.value = item.tanggal||''; form.item.value = item.item||''; form.jumlah.value = item.jumlah||''; form.satuan.value = item.satuan||''; form.hargaPerSatuan.value = item.hargaPerSatuan||'';
      form.tanggal.focus();
    }, (id)=>{
      const d = Store.load();
      d.pembelianBahan = d.pembelianBahan.filter(x=>x.id!==id);
      Store.save(d);
      renderRows();
    });

    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      const d = Store.load();
      const fd = new FormData(form);
      const payload = {
        id: fd.get('id')?.toString() || Store.uid('mat'),
        tanggal: fd.get('tanggal')?.toString(),
        item: fd.get('item')?.toString(),
        jumlah: Number(fd.get('jumlah')||0),
        satuan: fd.get('satuan')?.toString()||'',
        hargaPerSatuan: Number(fd.get('hargaPerSatuan')||0),
      };
      const idx = d.pembelianBahan.findIndex(x=>x.id===payload.id);
      if (idx>=0) d.pembelianBahan[idx] = payload; else d.pembelianBahan.push(payload);
      Store.save(d);
      form.reset(); renderRows();
    });
  }

  function viewPenjualan() {
    app.innerHTML = '';
    app.appendChild(tpl('tpl-penjualan'));
    const form = document.getElementById('formPenjualan');
    const tbody = document.querySelector('[data-table="penjualan"] tbody');

    function renderRows() {
      const rows = Store.load().penjualan.map(it => {
        const total = Number(it.hargaJualPerKg||0) * Number(it.beratTerjualKg||0);
        return `
        <tr>
          <td>${it.tanggal||''}</td>
          <td>${fmt.format(Number(it.beratTerjualKg||0))}</td>
          <td>${rupiah.format(Number(it.hargaJualPerKg||0))}</td>
          <td>${rupiah.format(total)}</td>
          <td>
            <div class="row-actions">
              <button class="btn" data-action="edit" data-id="${it.id}">Edit</button>
              <button class="btn danger" data-action="delete" data-id="${it.id}">Hapus</button>
            </div>
          </td>
        </tr>`;
      }).join('');
      tbody.innerHTML = rows || '<tr><td colspan="5" class="muted">Belum ada data</td></tr>';
    }

    renderRows();
    bindRowButtons(tbody, (id)=>{
      const item = Store.load().penjualan.find(x=>x.id===id);
      if (!item) return;
      form.id.value = item.id; form.tanggal.value = item.tanggal||''; form.beratTerjualKg.value = item.beratTerjualKg||''; form.hargaJualPerKg.value = item.hargaJualPerKg||''; form.catatan.value = item.catatan||'';
      form.tanggal.focus();
    }, (id)=>{
      const d = Store.load();
      d.penjualan = d.penjualan.filter(x=>x.id!==id);
      Store.save(d);
      renderRows();
    });

    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      const d = Store.load();
      const fd = new FormData(form);
      const payload = {
        id: fd.get('id')?.toString() || Store.uid('sell'),
        tanggal: fd.get('tanggal')?.toString(),
        beratTerjualKg: Number(fd.get('beratTerjualKg')||0),
        hargaJualPerKg: Number(fd.get('hargaJualPerKg')||0),
        catatan: fd.get('catatan')?.toString()||'',
      };
      const idx = d.penjualan.findIndex(x=>x.id===payload.id);
      if (idx>=0) d.penjualan[idx] = payload; else d.penjualan.push(payload);
      Store.save(d);
      form.reset(); renderRows();
    });
  }

  function viewPengaturan() {
    app.innerHTML = '';
    app.appendChild(tpl('tpl-pengaturan'));
    const root = app;
    root.addEventListener('click', (e)=>{
      const btn = e.target.closest('button');
      if (!btn) return;
      const action = btn.dataset.action;
      if (action === 'export-json') {
        Store.exportJSON();
      } else if (action === 'reset-data') {
        if (confirm('Yakin reset semua data?')) {
          localStorage.removeItem(Store.key('data'));
          alert('Data direset.');
        }
      } else if (action === 'logout') {
        sessionStorage.removeItem(Store.key('auth'));
        location.hash = '#/login';
      }
    });

    root.addEventListener('change', async (e)=>{
      const input = e.target;
      if (!(input instanceof HTMLInputElement)) return;
      const action = input.dataset.action;
      if (!action) return;
      const file = input.files?.[0]; if (!file) return;
      try {
        if (action === 'import-json') {
          await Store.importJSON(file);
          alert('Import JSON sukses');
        }
        if (action.startsWith('import-csv')) {
          const text = await file.text();
          const { rows } = Store.parseCSV(text);
          const d = Store.load();
          if (action === 'import-csv-ayam') {
            // expected headers: Tanggal, Supplier, Jumlah Ekor, Total Berat (Kg), Harga per Ekor, Harga per Kg
            rows.forEach(r=>{
              d.pembelianAyam.push({
                id: Store.uid('buy'),
                tanggal: r['Tanggal']||r['tanggal']||'',
                supplier: r['Supplier']||r['supplier']||'',
                jumlahEkor: Number(r['Jumlah Ekor']||r['jumlahEkor']||0),
                totalBeratKg: Number(r['Total Berat (Kg)']||r['totalBeratKg']||0),
                hargaPerEkor: Number(r['Harga per Ekor']||r['hargaPerEkor']||0),
                hargaPerKg: Number(r['Harga per Kg']||r['hargaPerKg']||0),
                totalHarga: undefined,
                catatan: r['Catatan']||''
              });
            });
          }
          if (action === 'import-csv-bahan') {
            // expected: Tanggal, Item, Jumlah (Satuan), Satuan, Harga per Satuan
            rows.forEach(r=>{
              d.pembelianBahan.push({
                id: Store.uid('mat'),
                tanggal: r['Tanggal']||r['tanggal']||'',
                item: r['Item']||r['item']||'',
                jumlah: Number(r['Jumlah (Satuan)']||r['jumlah']||0),
                satuan: r['Satuan']||r['satuan']||'',
                hargaPerSatuan: Number(r['Harga per Satuan']||r['hargaPerSatuan']||0)
              });
            });
          }
          if (action === 'import-csv-penjualan') {
            // expected: Tanggal, Berat Terjual (Kg), Harga Jual per Kg
            rows.forEach(r=>{
              d.penjualan.push({
                id: Store.uid('sell'),
                tanggal: r['Tanggal']||r['tanggal']||'',
                beratTerjualKg: Number(r['Berat Terjual (Kg)']||r['beratTerjualKg']||0),
                hargaJualPerKg: Number(r['Harga Jual per Kg']||r['hargaJualPerKg']||0),
                catatan: r['Catatan']||''
              });
            });
          }
          Store.save(d);
          alert('Import CSV sukses');
        }
      } catch (err) {
        console.error(err);
        alert('Gagal import: ' + err.message);
      } finally {
        input.value = '';
      }
    });
  }

  // Start
  render();
})();

