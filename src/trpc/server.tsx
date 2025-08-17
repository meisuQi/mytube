import 'server-only'; // <-- ensure this file cannot be imported from the client
import { createHydrationHelpers } from '@trpc/react-query/rsc';
import { cache } from 'react';
import { createCallerFactory, createTRPCContext } from './init';
import { makeQueryClient } from './query-client';
import { appRouter } from './routers/_app';
// `cache(makeQueryClient)` **确保 `QueryClient` 在一次请求生命周期内是唯一的**。
export const getQueryClient = cache(makeQueryClient);
// **直接在服务器端调用 `tRPC` API**，而不走 HTTP 请求，提高效率。
// - `caller` 是由 `createCallerFactory` 创建的一个实例，可以用来调用 `appRouter` 中定义的各种 API 方法。它的作用是提供一个接口来调用 API 路由，且带有上下文。- 可以使用 `caller` 来执行实际的业务逻辑，比如从前端发起请求到后端的 `tRPC` 路由。
const caller = createCallerFactory(appRouter)(createTRPCContext);
// `createHydrationHelpers` **用于服务器端数据预加载**，可以在 SSR 中获取数据并传递给客户端。
//**`HydrateClient` 组件**：客户端接收预加载数据，避免不必要的额外请求。
export const { trpc, HydrateClient } = createHydrationHelpers<typeof appRouter>(
  caller,
  getQueryClient,
);  