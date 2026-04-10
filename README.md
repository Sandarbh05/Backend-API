# 🎬 Full Stack Backend – Video Platform API

A complete backend system for a video-sharing platform built with Node.js, Express, and MongoDB.
This project handles users, videos, playlists, likes, comments, subscriptions, tweets, and dashboard analytics.

---

## 🚀 Features

### 👤 User System

* User registration & authentication (JWT-based)
* Profile management
* Secure routes with middleware

---

### 🎥 Video Management

* Upload and manage videos
* Track views
* Fetch videos with pagination & sorting
* Channel-based video listing

---

### 💬 Comments

* Add, update, delete comments
* Fetch comments with aggregation pipelines
* Linked with videos & users

---

### ❤️ Likes System

* Toggle like for:

  * Videos
  * Comments
  * Tweets
* Fetch liked videos

---

### 🧵 Tweets

* Create, update, delete tweets
* Fetch tweets per user

---

### 📂 Playlist System

* Create playlists
* Add/remove videos
* Update playlist details
* Fetch playlists with populated video data

---

### 🔔 Subscriptions

* Subscribe/unsubscribe to channels
* Fetch:

  * Channel subscribers
  * Subscribed channels

---

### 📊 Dashboard

* Channel statistics:

  * Total videos
  * Total views
  * Total likes
  * Total subscribers
* Channel video listing with pagination

---

### 🩺 Health Check

* Simple endpoint to verify server status

---

## 🛠 Tech Stack

* **Backend:** Node.js, Express.js
* **Database:** MongoDB with Mongoose
* **Authentication:** JWT
* **File Handling:** Multer + Cloudinary
* **Architecture:** REST API with MVC pattern

---

## 📡 API Endpoints (Overview)

### 🔐 Auth & Users

```
POST   /api/v1/users/register
POST   /api/v1/users/login
GET    /api/v1/users/profile
```

---

### 🎥 Videos

```
POST   /api/v1/videos
GET    /api/v1/videos
GET    /api/v1/videos/:videoId
DELETE /api/v1/videos/:videoId
```

---

### 💬 Comments

```
POST   /api/v1/comments/:videoId
GET    /api/v1/comments/:videoId
PATCH  /api/v1/comments/:commentId
DELETE /api/v1/comments/:commentId
```

---

### ❤️ Likes

```
POST   /api/v1/likes/video/:videoId
POST   /api/v1/likes/comment/:commentId
GET    /api/v1/likes/videos
```

---

### 🧵 Tweets

```
POST   /api/v1/tweets
GET    /api/v1/tweets/user/:userId
PATCH  /api/v1/tweets/:tweetId
DELETE /api/v1/tweets/:tweetId
```

---

### 📂 Playlists

```
POST   /api/v1/playlists
GET    /api/v1/playlists/user/:userId
GET    /api/v1/playlists/:playlistId
PATCH  /api/v1/playlists/:playlistId
DELETE /api/v1/playlists/:playlistId

POST   /api/v1/playlists/:playlistId/add/:videoId
DELETE /api/v1/playlists/:playlistId/remove/:videoId
```

---

### 🔔 Subscriptions

```
POST   /api/v1/subscriptions/:channelId
GET    /api/v1/subscriptions/channel/:channelId
GET    /api/v1/subscriptions/user/:subscriberId
```

---

### 📊 Dashboard

```
GET    /api/v1/dashboard/stats
GET    /api/v1/dashboard/videos
```

---

### 🩺 Health Check

```
GET    /api/v1/healthcheck
```

---

## ⚙️ How to Run

### 1️⃣ Clone the repository

```
git clone <your-repo-link>
cd <project-folder>
```

---

### 2️⃣ Install dependencies

```
npm install
```

---

### 3️⃣ Setup environment variables

Create a `.env` file and add:

```
PORT=8000
MONGODB_URI=your_mongodb_connection_string
ACCESS_TOKEN_SECRET=your_secret
ACCESS_TOKEN_EXPIRY=1d
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
```

---

### 4️⃣ Run the server

```
npm run dev
```

---

Server will run at:

```
http://localhost:8000
```

---

## 🧠 Key Concepts Used

* Aggregation pipelines (`$lookup`, `$group`, `$project`)
* Data relationships (User ↔ Video ↔ Playlist)
* Pagination & sorting
* Authorization & ownership checks
* Clean separation of read/write logic

---

## 📌 Final Note

This project focuses on building a **scalable backend architecture** with real-world features and clean API design.
It reflects practical backend development patterns rather than just basic CRUD.

---
