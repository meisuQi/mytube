import React from 'react'
import { SubscriptionsSection } from '../sections/subscriptions-section'




export const SubscriptionsView = () => {
  return (
    /* 设置元素的最大宽度为 中等屏幕宽度（medium screen），即 768px。 */
    <div className="max-w-screen-md mx-auto mb-10 px-4 pt-2.5 flex flex-col gap-y-6  ">
     <div>
      <h1 className="text-2xl font-bold">All subscriptions</h1>
     </div>
     <p className="text-xs text-muted-foreground">
      View and manage all your subscriptions
     </p>
      <SubscriptionsSection/>
    </div>  
  )
}
