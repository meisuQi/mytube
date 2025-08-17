import { categoriesRouter } from '@/modules/categories/server/procedures';
import {createTRPCRouter } from '../init';
import { studioRouter } from '@/modules/studio/server/procedures';
import { videoViewsRouter } from '@/modules/video-views/server/procedure';
import { videoReactionsRouter } from '@/modules/video-reactions/server/procedure';
import { subscriptionsRouter } from '@/modules/subscriptions/server/procedures';
import { commentsRouter } from '@/modules/comments/server/procedure';
import { commentReactionsRouter } from '@/modules/comment-reactions /server/procedure';
import { videosRouter } from '@/modules/videos /server/procedures';
import { suggestionsRouter } from '@/modules/suggestions/server/procedures';
import { searchRouter } from '@/modules/search/server/procedures';
import { playlistsRouter } from '@/modules/playlists/server/procedures';
import { usersRouter } from '@/modules/users/server/procedures';
import { notificationRouter } from '@/modules/notifications/server/procedures';
export const appRouter = createTRPCRouter({
   categories:categoriesRouter, 
   studio:studioRouter,
   videos:videosRouter,
   playlists:playlistsRouter,
   comments:commentsRouter,
   videoViews:videoViewsRouter,
   videoReactions:videoReactionsRouter,
   subscriptions:subscriptionsRouter,
   commentReactions:commentReactionsRouter,
   suggestions:suggestionsRouter,
   search:searchRouter,
   users:usersRouter,
   notification:notificationRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;