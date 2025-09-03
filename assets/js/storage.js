// Simple LocalStorage-backed store with namespaced keys
(function(){
  const NS = 'ayamnaia.v1';
  const key = (k) => `${NS}:${k}`;

  const initial = {
    users: [
      // password is sha256 of 'admin123'
      { id: 'u1', username: 'admin', passwordSha256: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', role: 'admin' }
    ],
    suppliers: [],
    pembelianAyam: [],
    pembelianBahan: [],
    penjualan: [],
    settings: {},
  };

  function load() {
    const raw = localStorage.getItem(key('data'));
    if (!raw) return JSON.parse(JSON.stringify(initial));
    try { return Object.assign(JSON.parse(JSON.stringify(initial)), JSON.parse(raw)); }
    catch { return JSON.parse(JSON.stringify(initial)); }
  }

  function save(data) {
    localStorage.setItem(key('data'), JSON.stringify(data));
  }

  function uid(prefix='id') { return `${prefix}_${Math.random().toString(36).slice(2,9)}`; }

  async function sha256Hex(text) {
    const enc = new TextEncoder().encode(text);
    const hash = await crypto.subtle.digest('SHA-256', enc);
    const bytes = Array.from(new Uint8Array(hash));
    return bytes.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function exportJSON() {
    const blob = new Blob([localStorage.getItem(key('data')) || JSON.stringify(initial)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'ayamnaia-data.json'; a.click();
    URL.revokeObjectURL(url);
  }

  function importJSON(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result);
          save(Object.assign(JSON.parse(JSON.stringify(initial)), data));
          resolve();
        } catch (e) { reject(e); }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  function parseCSV(text) {
    // simple CSV parser (no quoted commas support for simplicity)
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length === 0) return { headers: [], rows: [] };
    const headers = lines[0].split(',').map(h => h.trim());
    const rows = lines.slice(1).map(line => {
      const cols = line.split(',');
      const obj = {};
      headers.forEach((h,i)=> obj[h] = (cols[i]||'').trim());
      return obj;
    });
    return { headers, rows };
  }

  window.Store = {
    key, load, save, uid, sha256Hex,
    exportJSON, importJSON, parseCSV,
  };
})();
