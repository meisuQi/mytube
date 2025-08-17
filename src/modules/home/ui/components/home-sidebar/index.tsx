import { SidebarContent,Sidebar } from '@/components/ui/sidebar'
import React from 'react'
import { MainSection } from './main-section'
import { Separator } from '@/components/ui/separator'
import { PersonalSection } from './personal-section'
import { SubscriptionsSection } from './subscriptions-section'
import { SignedIn } from '@clerk/nextjs'

export const HomeSidebar = () => {
  return (
    // collapsible='icon'当二次点击侧边栏按钮时，侧边栏不会完全消失，还会留下图标
    <Sidebar className="pt-16 z-40 border-none" collapsible='icon'>
      <SidebarContent className="bg-background">
        <MainSection/>
        <Separator/>
        <PersonalSection/>
        <SignedIn>
          <>
            <Separator/>
            <SubscriptionsSection/>
          </>
        </SignedIn>
      </SidebarContent>
    </Sidebar>
  ) 
}


