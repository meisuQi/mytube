import { SidebarHeader, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { UserAvatar } from '@/components/user-avatar';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import React from 'react'

const StudioSidebarHeader = () => {
  const {user}=useUser();
  const {state}=useSidebar();
  if(!user){
    return (
    <SidebarHeader className="flex items-center justify-center pb-4">
      <Skeleton className='size-[112px] rounded-full'/>
      <div className="flex flex-col items-center mt-2 gap-y-">
        <Skeleton className="h-4 w-[80px] "/>
        <Skeleton className="h-4 w-[100px]"/>
      </div>
    </SidebarHeader>
  )}
  if(state==="collapsed"){
    return(
      <SidebarMenuItem>
         <SidebarMenuButton tooltip="Your profile" asChild>
            <Link href="/users/current">
              <UserAvatar
                imageUrl={user.imageUrl}
                name={user.fullName ?? "User"}
                size="xs"
              />
              <span className="text-sm">Your profile</span>
            </Link>
          </SidebarMenuButton> 
      </SidebarMenuItem>
    )
  }
  return (
    <SidebarHeader className="flex items-center justify-center pb-4">
      <Link href="/users/current">
        <UserAvatar
          imageUrl={user.imageUrl}
          name={user.fullName??"User"}
          className="size-[112px] hover:opacity-80 transition-opacity"
        />
      </Link>
      <div className="flex flex-col items-center mt-2 gap-y-1">
        <p className="text-sm font-medium">
          Your profile
        </p>
        {/* text-muted-foreground 表示“次要文本颜色”，用于表示界面中不那么重要的文字，比如副标题、说明文字、提示语等。它通常是一个灰色、对比度较低的颜色，用于降低视觉权重，使主信息更突出。要知道它具体是哪种灰色（如 #6b7280），需要看你的 Tailwind 配置中是否有类似下面的设置：
            extend: {
              colors: {
                'muted': {
                  foreground: '#6b7280' // just an example
                }
              }
            } */}
        <p className="text-xs text-muted-foreground">
        {user.fullName}
        </p>
      </div>
    </SidebarHeader>
  )
}

export default StudioSidebarHeader