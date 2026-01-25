# LK21 API Deployment Guide

## Langkah 1: Fork Repository

1. Buka https://github.com/febriadj/lk21-api
2. Klik tombol **Fork** di kanan atas
3. Repository akan ter-copy ke akun GitHub Anda

## Langkah 2: Deploy ke Vercel (GRATIS)

### Via Vercel Dashboard:

1. Buka https://vercel.com
2. Login dengan GitHub
3. Klik **"Add New Project"**
4. Pilih repository `lk21-api` yang sudah di-fork
5. Klik **"Deploy"**

### Environment Variables (PENTING!):

Sebelum deploy, tambahkan environment variables ini:

```
LK21_URL=https://tv.lk21official.live
ND_URL=https://tv.nontondrama.lol
```

**Cara menambahkan:**

- Di Vercel dashboard → Project Settings → Environment Variables
- Tambahkan kedua variable di atas
- Redeploy project

## Langkah 3: Dapatkan URL Deployment

Setelah deploy selesai, Vercel akan memberikan URL seperti:

```
https://lk21-api-xxxxx.vercel.app
```

## Langkah 4: Update Website Anda

1. Buka file `js/main.js`
2. Cari baris:
   ```javascript
   const LK21_API_URL = "https://YOUR-LK21-API.vercel.app";
   ```
3. Ganti dengan URL deployment Anda:
   ```javascript
   const LK21_API_URL = "https://lk21-api-xxxxx.vercel.app";
   ```
4. Save dan refresh website

## Langkah 5: Test

1. Buka website Anda
2. Klik menu **Movies**
3. Klik tab **"LK21 Movies"**
4. Film-film dengan subtitle Indonesia akan muncul!

## Troubleshooting

### Error: "LK21 API Not Configured"

- Pastikan sudah mengganti `YOUR-LK21-API` dengan URL deployment Anda
- Refresh halaman (Ctrl+F5)

### Error: "Unable to load LK21 movies"

- Cek apakah deployment Vercel sudah selesai
- Test URL API langsung di browser: `https://your-url.vercel.app/popular/movies`
- Pastikan environment variables sudah di-set

### API Lambat

- LK21 API melakukan web scraping, jadi bisa lambat
- Vercel free tier bisa cold start (tunggu 5-10 detik pertama kali)

## Alternative: Deploy ke Railway

1. Buka https://railway.app
2. Login dengan GitHub
3. New Project → Deploy from GitHub
4. Pilih `lk21-api`
5. Tambahkan environment variables yang sama
6. Deploy!

---

**Catatan**: LK21 API ini gratis selamanya di Vercel/Railway free tier!
