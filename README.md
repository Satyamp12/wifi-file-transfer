# 📱 WiFi File Transfer

Phone se TV (ya koi bhi device) me files transfer karo bina internet ke. Phone WiFi hotspot on karo, TV connect karo, bas! Koi USB ya internet ki zarurat nahi.

## Kaise Kaam Karta Hai

```
📱 Phone (Hotspot ON)          📺 TV (Browser)
   ┌─────────────┐               ┌─────────────┐
   │  File Server │  ◄══ WiFi ══►│   Browser    │
   │  (Node.js)   │   Hotspot    │  (URL kholo) │
   └─────────────┘               └─────────────┘
        │                              │
   Files upload                  Files download
   Files download                Files upload
```

1. Phone pe WiFi hotspot on karo
2. Phone pe ye server chalao
3. TV us hotspot se connect karo
4. TV ke browser me phone ka IP kholo (ya QR code scan karo)
5. Files transfer karo — dono taraf se!

## Features

- **Drag & Drop Upload** — Files seedha drag karke upload karo
- **Real-time Progress** — Upload ka progress bar saath saath dikhega
- **QR Code** — Scan karke turant connect karo
- **File Preview** — Images, videos, text files ka preview browser me
- **Download & Delete** — Har file ka download aur delete button
- **TV Friendly** — Bade screen ke liye optimized UI
- **File Types** — Photos, videos, music, docs, APKs — sab kuch
- **5GB Max** — Files up to 5GB transfer kar sakte ho
- **No Internet** — Sirf local WiFi hotspot, data kharch nahi

## Setup (Ek Baar)

### Computer / Laptop pe chalane ke liye

```bash
# 1. Dependencies install karo (pehli baar)
npm install

# 2. Server start karo
npm start
```

Server start hote hi terminal me IP address dikh jayega, jaise:
```
📡 Wi-Fi:  http://10.70.246.165:3000
```

### Phone (Android) pe chalane ke liye

Phone pe chalane ke 2 tarike:

#### Tariqa 1: Termux (No-root, easy)

1. Play Store se **Termux** install karo
2. Termux me ye commands dalo:
```bash
pkg install nodejs git
# Project folder phone me copy karo (USB se ya download)
cd wifi-file-transfer
npm install
node server.js
```

#### Tariqa 2: Phone pe hotspot + computer pe server

1. Computer/laptop pe server chalao (`npm start`)
2. Phone ka hotspot ON karo
3. Computer us hotspot se connect karo
4. TV bhi us hotspot se connect karo
5. TV browser me computer wala IP kholo

## Step-by-Step: Phone se TV me Transfer

### Step 1: WiFi Hotspot On Karo
- Phone ke **Settings > Hotspot & Tethering** me jao
- **Portable WiFi Hotspot** ON karo

### Step 2: Server Start Karo
- Phone pe (Termux se): `node server.js`
- Terminal me IP address dikh jayega (jaise `http://192.168.43.1:3000`)

### Step 3: TV ko Hotspot se Connect Karo
- TV ki **WiFi Settings** me jao
- Apne phone ka hotspot select karke connect karo

### Step 4: TV Browser me URL Kholo
- TV ka browser kholo
- Terminal me jo IP mila waho dalo (jaise `http://192.168.43.1:3000`)
- Ya phone pe web page ka **QR Code** button dabao, TV se scan karo

### Step 5: Transfer Karo!
- Phone se file upload karo → TV pe download karo
- TV se file upload karo → Phone pe save ho jayega

## API Endpoints

| Method | Route | Kaam |
|--------|-------|------|
| GET | `/` | Web UI (main page) |
| GET | `/api/info` | Server info + IP + QR code |
| GET | `/api/files` | Saari files ki list |
| POST | `/api/upload` | File upload (multipart/form-data) |
| GET | `/api/download/:filename` | File download |
| DELETE | `/api/delete/:filename` | File delete |

## Project Structure

```
satyam11/
├── package.json          # Dependencies
├── server.js             # Express + Socket.io server
├── public/
│   ├── index.html        # Web UI page
│   ├── css/
│   │   └── style.css     # Dark theme responsive CSS
│   └── js/
│       └── app.js        # Upload, download, preview logic
├── uploads/              # Transferred files yahaan save hote hain
└── README.md
```

## Tips

- **Hotspot IP**: Aksar `192.168.43.1` (Android) ya `172.20.10.1` (iPhone) hota hai
- **Same WiFi**: Agar hotspot nahi, to phone aur TV same WiFi pe bhi connect kar sakte hain
- **Large Files**: 5GB tak ki files transfer ho sakti hain, network speed par depend karta hai
- **Security**: Ye server sirf us network pe accessible hai jispe phone connected hai. Public WiFi pe use mat karo.

## Tech Stack

- **Node.js** + **Express** — HTTP server
- **Socket.io** — Real-time updates
- **Multer** — File upload handling
- **QRCode** — QR code generation
- **Vanilla JS** — Frontend (koi framework nahi, fast loading)
