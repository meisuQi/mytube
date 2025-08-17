import { DEFAULT_LIMIT } from '@/constants';
import { SubscribedView } from '@/modules/home/ui/views/subscribed-view';
import { HydrateClient, trpc } from '@/trpc/server'
import React from 'react'
export const dynamic ="force-dynamic";



const Page =() => {
 
  void trpc.videos.getManySubscribed.prefetchInfinite({limit:DEFAULT_LIMIT})
  return (
    <HydrateClient>
      <SubscribedView/>
    </HydrateClient>
  )
}

export default Page;