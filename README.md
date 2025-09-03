Stok Ayam Naia – Aplikasi Web (HTML/CSS/JS)

Ringkas: SPA mobile-first berbasis LocalStorage untuk login sederhana, CRUD data pembelian ayam, pembelian bahan, penjualan, supplier, serta dashboard ringkasan. Import/Export data via JSON, dan import CSV per entitas (ekspor Excel ke CSV terlebih dahulu).

Cara Pakai

- Buka `index.html` langsung di VS Code dengan Live Server atau double-click di file explorer.
- Login default: username `admin`, password `admin123`.
- Navigasi via tab: Dashboard, Pembelian Ayam, Pembelian Bahan, Penjualan, Supplier, Pengaturan.
- Data tersimpan di LocalStorage browser; gunakan Export JSON untuk backup.

Struktur Data (mengacu kolom Excel)

- Pembelian Ayam: Tanggal, Supplier, Jumlah Ekor, Total Berat (Kg), Harga per Ekor, Harga per Kg, Catatan.
- Pembelian Bahan: Tanggal, Item, Jumlah (Satuan), Satuan, Harga per Satuan.
- Penjualan: Tanggal, Berat Terjual (Kg), Harga Jual per Kg, Catatan.
- Ringkasan: Total Berat Masuk (Kg), Stok Ayam Tersisa (Kg) = (berat masuk - terjual), Total Pembelian Ayam, Total Pembelian Bahan, Total Penjualan, Laba/Rugi.

Import CSV (tanpa library eksternal)

- Ekspor sheet Excel ke CSV dengan header persis seperti di atas.
- Pengaturan → Import CSV sesuai entitas:
  - Pembelian Ayam: Tanggal, Supplier, Jumlah Ekor, Total Berat (Kg), Harga per Ekor, Harga per Kg, (opsional Catatan)
  - Pembelian Bahan: Tanggal, Item, Jumlah (Satuan), Satuan, Harga per Satuan
  - Penjualan: Tanggal, Berat Terjual (Kg), Harga Jual per Kg, (opsional Catatan)

Catatan Teknis

- Tidak ada backend (database) agar bisa langsung jalan tanpa install apa pun. Jika dibutuhkan, bisa ditambah server Node/Express atau SQLite pada tahap berikutnya.
- Autentikasi sederhana di sisi client (untuk demo). Jangan gunakan di produksi.
- Desain mobile-first/responsif: komponen form grid dan tabel scrollable.

Pengembangan Lanjutan (opsional)

- Import langsung dari XLSX memakai SheetJS (perlu bundling/akses internet).
- Multi-user + role, dan audit log.
- Grafik penjualan dan persediaan.

