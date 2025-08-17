import React from 'react'
import { TrendingVideoSection } from '../sections/trending-video-section';


export const TrendingView = () => {
  return (
    <div className="max-w-[2400px] mx-auto mb-10 px-4 pt-2.5 flex flex-col gap-y-6 ">
     <div>
      <h1 className="text-2xl font-bold">Trending</h1>
     </div>
     <p className="text-xs text-muted-foreground">
      Most popular videos at the moment
     </p>
      <TrendingVideoSection/>
    </div>  
  )
}
