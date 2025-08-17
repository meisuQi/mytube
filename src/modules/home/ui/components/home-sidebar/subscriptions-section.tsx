'use client'
import { 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem 
} from '@/components/ui/sidebar'
import Link from 'next/link'
import React from 'react'
import { usePathname } from 'next/navigation'
import { trpc } from '@/trpc/client'
import { DEFAULT_LIMIT } from '@/constants'
import { UserAvatar } from '@/components/user-avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { ListIcon } from 'lucide-react'

export const LoadingSkeleton=()=>{
  return(
      <>
        {[1,2,3,4].map((i) => (
          <SidebarMenuItem key={i}>
            <SidebarMenuButton >
              <Skeleton className="size-6 rounded-full shrink-0"/>
              <Skeleton className="h-4 w-full"/>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))
        }
        </>
  )
}

export const SubscriptionsSection = () => {
  const pathname=usePathname();
  const {data,isLoading}=trpc.subscriptions.getMany.useInfiniteQuery(
    {
      limit:DEFAULT_LIMIT,
    },
    {
      getNextPageParam:(lastPage)=>lastPage.nextCursor,
    }
  )
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Subscriptions</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {isLoading && <LoadingSkeleton/>}
          {!isLoading && data?.pages.flatMap((page)=>page.items).map((subscription)=>(
            <SidebarMenuItem key={`${subscription.creatorId}-${subscription.viewerId}`}>
              <SidebarMenuButton
              // tooltip is a custom prop used to display hover tooltips（提示信息）.When the user hovers over an element, the tooltip shows text or custom content.
                tooltip={subscription.user.name}
                // asChild is a common prop in Radix UI and shadcn/ui.It allows a component to render as its child instead of its default tag.
                asChild
                isActive={pathname===`/users/${subscription.user.id}`}//TODO:Change to look at current pathname
              >
                <Link href={`/users/${subscription.user.id}`} className="flex items-center gap-4">
                  {/* <item.icon/> 是一种常见的JSX 语法，通常用于动态渲染组件或图标。在这种写法中，item.icon 通常是一个包含图标组件或元素的变量，<item.icon /> 就是把该图标组件渲染到页面上。 */}
                  <UserAvatar
                    size="xs"
                    imageUrl={subscription.user.imageUrl}
                    name={subscription.user.name}
                  />
                  <span className="text-sm">{subscription.user.name}</span>
                </Link>  
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          {!isLoading &&(
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname==="/subscriptions"}
            >
              <Link href='/subscriptions' className="flex items-center gap-4">
                 <ListIcon className="size-4"/>
                 <span className="text-sm">All subscriptions</span> 
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
