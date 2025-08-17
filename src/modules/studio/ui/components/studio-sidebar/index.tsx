'use client'
import { 
  SidebarContent,
  Sidebar, 
  SidebarGroup, 
  SidebarMenuItem,
  SidebarMenu, 
  SidebarMenuButton } from '@/components/ui/sidebar';
import React from 'react';
import Link from 'next/link';
import { LogOutIcon, VideoIcon } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import StudioSidebarHeader from './studio-sidebar-header';

export const StudioSidebar = () => {
  const pathname=usePathname();
  return (
    // collapsible='icon'当二次点击侧边栏按钮时，侧边栏不会完全消失，还会留下图标
    <Sidebar className="pt-16 z-40 " collapsible="icon">
      <SidebarContent className="bg-background">
       <SidebarGroup>
        <SidebarMenu>
          <StudioSidebarHeader/>
          <SidebarMenuItem> 
            {/* tooltip="Exit Studio"当用户把鼠标悬停在按钮上时，会显示一个提示文字：“Exit Studio”。
            意思是：这个组件不会自己渲染一个 HTML 标签（比如 <button> 或 <div>），而是“把功能赋予”你传进去的子组件。
              📌 也就是：你可以这样写——
              <SidebarMenuButton tooltip="Exit Studio" asChild>
                <Link href="/">...</Link>
              </SidebarMenuButton>
              这时候，真正被渲染成 DOM 的是 <Link>，但它具有了 SidebarMenuButton 的样式、交互、tooltip 等功能。
            */}
            <SidebarMenuButton isActive={pathname==='/studio'} tooltip="Content" asChild>
              <Link href="/studio">
                <VideoIcon className="size-5"/>
                <span className="text-sm">Content</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <Separator/>
          <SidebarMenuItem> 
            <SidebarMenuButton tooltip="Exit Studio" asChild>
              <Link href="/">
                <LogOutIcon className="size-5"/>
                <span className="text-sm">Exit Studio</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        </SidebarGroup> 
      </SidebarContent>
    </Sidebar>
  ) 
}


