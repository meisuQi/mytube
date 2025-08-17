'use client';
// ^-- to make sure we can mount the Provider from a server component
import type { QueryClient } from '@tanstack/react-query';
import { QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import { useState } from 'react';
import { makeQueryClient } from './query-client';
import type { AppRouter } from './routers/_app';
import superjson from 'superjson';
import { APP_URL } from '@/constants';
//创建 `tRPC` 实例。createTRPCReact<AppRouter>():让 trpc 具备 React Query 的能力。
export const trpc = createTRPCReact<AppRouter>();
//创建 `QueryClient`
let clientQueryClientSingleton: QueryClient;
function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return makeQueryClient();
  }
  // Browser: use singleton pattern to keep the same query client
  return (clientQueryClientSingleton ??= makeQueryClient());
}
//确定 API 服务器的 URL
// 通过 httpBatchLink，客户端配置了如何与服务器上的 /api/trpc 路由进行交互。这一设置确保了客户端请求会通过 httpBatchLink 发送到指定的后端 API。
function getUrl() {
  const base = (() => {
    if (typeof window !== 'undefined') return '';
    if (APP_URL) return `https://${APP_URL}`;
    //Crucial to modify in .env to production domain (including protocol)
    return APP_URL;
  })();
  return `${base}/api/trpc`;
}
//`TRPCProvider`(上下文) 组件
export function TRPCProvider(
  props: Readonly<{
    children: React.ReactNode;
  }>,
) {
  // 初始化 QueryClient。使用单例缓存客户端的 QueryClient 实例
  const queryClient = getQueryClient();
  // 初始化 `tRPC` 客户端
  //createClient 方法创建了一个 tRPC 客户端实例。它会使用 httpBatchLink 来配置如何发送 HTTP 请求到服务器的 API 路由。
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          transformer: superjson, 
          url: getUrl(),
        }),
      ],
    }),
  );
  return (
    // 提供 tRPC 的客户端上下文。 
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      {/* 提供 React Query 的全局状态上下文 */}
      <QueryClientProvider client={queryClient}>
        {props.children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
// TRPCProvider 组件为子组件提供了 tRPC 客户端和 React Query 的全局状态上下文。client={trpcClient} 将客户端实例传递给 tRPC，使得子组件能够通过 trpc 进行后端 API 调用。