import { DEFAULT_LIMIT } from '@/constants';
import { StudioView } from '@/modules/studio/ui/views/studio-view';
import { HydrateClient, trpc } from '@/trpc/server';
import React from 'react'

export const dynamic ="force-dynamic";

const Page = () => {
  // prefetchInfinite 是 tRPC 中用于请求数据的一个方法，通常与无限滚动（infinite scrolling）或分页相关。它的作用是提前加载一批数据，以便在用户滚动或请求更多数据时，可以快速展示，而不是在每次请求时都等待数据加载。
  void trpc.studio.getMany.prefetchInfinite({
    limit:DEFAULT_LIMIT,
  }
  );
  return (
    <HydrateClient>
      <StudioView/>
    </HydrateClient>
  )
}

export default Page