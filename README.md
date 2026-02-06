# Undangan Pernikahan (GitHub Pages)

Template undangan website statis:
- Nama tamu dari URL: `?to=Nama+Tamu`
- Cover gate: tombol "Buka Undangan"
- Musik latar + tombol mute
- Countdown
- Detail acara + Google Maps
- Galeri + lightbox
- RSVP + Buku Ucapan (default `localStorage`)

## Cara pakai
1. Edit data di `data/config.json`
2. Masukkan foto di `assets/img/` dan musik di `assets/audio/song.mp3`
3. Push ke GitHub

## Deploy GitHub Pages
- Repo → **Settings** → **Pages**
- Source: `Deploy from a branch`
- Branch: `main` / `master`, folder `/ (root)`
- Simpan, tunggu 1-2 menit.

## Custom link nama tamu
Contoh:
`https://username.github.io/repo/?to=Nama+Tamu`

## Mode RSVP Online (opsional)
Default data RSVP & ucapan disimpan di browser (localStorage).
Kalau mau online:
- set `rsvp.submitMode = "endpoint"`
- isi `rsvp.endpointUrl` di config.json
Endpoint bisa pakai Google Apps Script / Firebase / Supabase.