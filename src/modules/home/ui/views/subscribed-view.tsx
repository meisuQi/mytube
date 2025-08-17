import React from 'react';
import { SubscribedVideoSection } from '../sections/subscribed-video-section';


export const SubscribedView = () => {
  return (
    <div className="max-w-[2400px] mx-auto mb-10 px-4 pt-2.5 flex flex-col gap-y-6 ">
     <div>
      <h1 className="text-2xl font-bold">Subscribed</h1>
     </div>
     <p className="text-xs text-muted-foreground">
      Videos from your subscribed creators
     </p>
      <SubscribedVideoSection/>
    </div>  
  )
}
