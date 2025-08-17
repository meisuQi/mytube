'use client'
import { 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem 
} from '@/components/ui/sidebar'
import { FlameIcon, HomeIcon, PlaySquareIcon } from 'lucide-react'
import Link from 'next/link'
import React from 'react'
import{useAuth,useClerk} from '@clerk/nextjs'
import { usePathname } from 'next/navigation'
const items=[
  {
    title:"Home",
    url:"/",
    icon:HomeIcon,
  },
  // this page will only be rendered to authorized users,because this is used to load videos from your subscriptions,if you are not logged ,you don't have any subscriptions  
  {
    title:"Subscriptions",
    url:"/feed/subscriptions",
    icon:PlaySquareIcon,
    auth:true,
  },
  {
    title:"Trending",
    url:"/feed/trending",
    icon:FlameIcon,
  }
]

export const MainSection = () => {
  const clerk=useClerk();
  const {isSignedIn}=useAuth();
  const pathname=usePathname();
  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item)=>(
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
              // tooltip is a custom prop used to display hover tooltips（提示信息）.When the user hovers over an element, the tooltip shows text or custom content.
                tooltip={item.title}
                // asChild is a common prop in Radix UI and shadcn/ui.It allows a component to render as its child instead of its default tag.
                asChild
                isActive={pathname===item.url}//TODO:Change to look at current pathname
                onClick={(e)=>{
                  if(!isSignedIn && item.auth){
                    e.preventDefault();
                    return clerk.openSignIn();
                  }
                }}//TODO:do something on click
              >
                <Link href={item.url} className="flex items-center gap-4">
                  {/* <item.icon/> 是一种常见的JSX 语法，通常用于动态渲染组件或图标。在这种写法中，item.icon 通常是一个包含图标组件或元素的变量，<item.icon /> 就是把该图标组件渲染到页面上。 */}
                  <item.icon/>
                  <span className="text-sm">{item.title}</span>
                </Link>  
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
