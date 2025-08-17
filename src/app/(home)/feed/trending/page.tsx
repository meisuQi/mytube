import { DEFAULT_LIMIT } from '@/constants';
import { TrendingView } from '@/modules/home/ui/views/trending-view';
import { HydrateClient, trpc } from '@/trpc/server'
import React from 'react'
export const dynamic ="force-dynamic";



const Page =() => {
 
  void trpc.videos.getTrending.prefetchInfinite({limit:DEFAULT_LIMIT})
  return (
    <HydrateClient>
      <TrendingView/>
    </HydrateClient>
  )
}

export default Page;