# Mytube system desigm document

## Overview  

This is a video sharing platform built with React,Next.js,TailwindCSS,Clerk,Mux,tRPC,Drizzle ORM,PostgreSQL,Bun.It supports user registration,login,video upload,subscriptions,playback,comments,notifications,and likes.you can also browse the history videos list that you have been viewed in the past , videos list that you liked.you can create your own playlist,and populate any videos to this playlist.

## System Goals  

Build a scalable and maintainable video platform

Provide smmoth UX(user experience) with a clean interface

Support basic social interactions :comments, likes,bullet chat, subscriptions

Enable video upload，transcoding, and playback

## Architecture Diagram 

[Client (Next.js + Clerk)] ↔ [tRPC API Layer] ↔ [Server (Next.js API routes)]
                                       ↘
                                      [Mux API]（webhook）
                                       ↘
                                [PostgreSQL via Drizzle ORM]
                                       ↘
                                   [Clerk Auth System] (webhook)

## Core Modules  

| Module                  | Description                                                  |
| ----------------------- | ------------------------------------------------------------ |
| **Auth Module**         | Implements user registration, login, and logout using **Clerk**. |
| **Video Upload Module** | Allows users to select video files, upload them to **Mux**, and generate playback URLs. |
| **Video Playback**      | Plays videos using the **Mux Player**.                       |
| **Comment System**      | Uses **Drizzle** to define database tables and **tRPC** to provide CRUD APIs. |
| **Playlist System**     | Allows users to create, edit, delete playlists, and add/remove videos from playlists. |
| **Like System**         | Enables like/unlike functionality and prevents duplicate actions. |
| **User Profile**        | Displays user information and upload history.                |

## Data Models  (Drizzle)

### users

| id   | clerk_id | name | image_url | created_at | updated_at | commentReactions | comments | subscriptions | subscribers | videoReactions | videoViews | videos |
| ---- | -------- | ---- | --------- | ---------- | ---------- | ---------------- | -------- | ------------- | ----------- | -------------- | ---------- | ------ |
|      |          |      |           |            |            |                  |          |               |             |                |            |        |

### categories

| Id   | Name | Description            | created_at | Updated_at | Videos |
| ---- | ---- | ---------------------- | ---------- | ---------- | ------ |
|      |      | Science and Technology |            |            |        |
|      |      | Film and animation     |            |            |        |
|      |      | Music                  |            |            |        |
|      |      | News and politics      |            |            |        |
|      |      | Gaming                 |            |            |        |
|      |      | Eduction               |            |            |        |
|      |      | Pets and Animals       |            |            |        |
|      |      | Sports                 |            |            |        |
|      |      | Travel and events      |            |            |        |

### videos

| id   | title | description | user_id | created_id | updated_at | category_id | mux_status | mux_asset_id | mux_upload _id | mux_playback_id | mux_track_id | mux_track_status | thumbnail_url | preview_url | duration | visibility | thumbnail_key | preview_key | comments |
| ---- | ----- | ----------- | ------- | ---------- | ---------- | ----------- | ---------- | ------------ | -------------- | --------------- | ------------ | ---------------- | ------------- | ----------- | -------- | ---------- | ------------- | ----------- | -------- |
|      |       |             |         |            |            |             |            |              |                |                 |              |                  |               |             |          |            |               |             |          |

| reactions | views | user | category |
| --------- | ----- | ---- | -------- |
|           |       |      |          |

#### Video-views

| user_id | video_id | created_at | updated_at | user | videos |
| ------- | -------- | ---------- | ---------- | ---- | ------ |
|         |          |            |            |      |        |

#### Video-reactions

| user_id | video_id | type | created_at | updated_at | user | videos |
| ------- | -------- | ---- | ---------- | ---------- | ---- | ------ |
|         |          |      |            |            |      |        |

### subscriptions

| viewer_id | creator_id | created_at | updated_at | viewer | creator |
| --------- | ---------- | ---------- | ---------- | ------ | ------- |
|           |            |            |            |        |         |

### comments

| id   | user_id | video_id | value | created_at | updated_at | parentId | reactions | user | video | parent | replies |
| ---- | ------- | -------- | ----- | ---------- | ---------- | -------- | --------- | ---- | ----- | ------ | ------- |
|      |         |          |       |            |            |          |           |      |       |        |         |

#### comment_reactions

| user_id | comment_id | type | created_at | updated_at | user | comment |
| ------- | ---------- | ---- | ---------- | ---------- | ---- | ------- |
|         |            |      |            |            |      |         |

### Playlists

| id   | name | type | description | user_id | created_at | updated_at | playlistVideos | user |
| ---- | ---- | ---- | ----------- | ------- | ---------- | ---------- | -------------- | ---- |
|      |      |      |             |         |            |            |                |      |

### playlist_videos

| playlist_id | video_id | created_at | updated_at | playlist | video |
| ----------- | -------- | ---------- | ---------- | -------- | ----- |
|             |          |            |            |          |       |

### notifications

| id   | type | sender_id | recipient_id | video_id | comment_id | read |
| ---- | ---- | --------- | ------------ | -------- | ---------- | ---- |
|      |      |           |              |          |            |      |

## API Design  (tRPC)

### user:usersRouter

#### getOne

### videos:videosRouter

#### getOne

#### generateTitle

#### generateDescription

#### generateThumbnail

#### revalidate

#### restoreThumbnail

#### remove

#### update

#### create

### videoViews:videoViewsRouter

#### create

### videoReactions:videoReactionsRouter

#### like

#### dislike

### categories:categoriesRouter

#### getMany

### studio:studioRouter

#### getOne

#### getMany

### subscriptions:subscriptionsRouter	 

#### create

#### remove

### comments:commentsRouter 

#### create

#### remove

#### getMany

### commentReactions:commentReactionsRouter

#### like

#### dislike

### suggestions:suggestionsRouter

#### getMany

### playlists:playlistsRouter

#### remove

#### getOne

#### getVideos

#### removeVideo

#### addVideo

#### getManyForVideo

#### getMany

#### create

#### getLiked

#### getHistory

### search:searchRouter

#### getMany

#### getUsers

### notification:notificationRouter

#### create

#### getUnreadCount

#### getAll

#### markOneAsRead

#### markAllAsRead

## Third-Party Integration  

| Service         | Type                | Purpose                                                      |
| --------------- | ------------------- | ------------------------------------------------------------ |
| **Clerk**       | Auth Service        | User registration, authentication, and authorization.        |
| **Mux**         | Media Service       | Video upload, transcoding, adaptive streaming playback.      |
| **UploadThing** | File Upload Service | Handles small file uploads like thumbnails or avatars.       |
| **Drizzle**     | ORM Framework       | Type-safe ORM for interacting with PostgreSQL.               |
| **PostgreSQL**  | Database            | Stores user data, video metadata, comments, likes, etc.      |
| **ngrok**       | Local Dev Tool      | Exposes local server endpoints for debugging webhooks (e.g., Clerk,Mux). |

## Authentication & Security  

All user actions requires authentication(comments,likes,notification,upload videos)

Use Clerk JWTs for authentication.

## Deployment & Environments  

 Clerk and Mux test keys are stored in `.env.local`
 Deploy via Vercel with GitHub integration
 Use separate env files for prod/dev separation

