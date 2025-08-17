import { SidebarTrigger } from '@/components/ui/sidebar'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import { SearchInput } from './search-input'
import { AuthButton } from '@/modules/auth/ui/components/auth-button'
import { NotificationIcon } from './notification-icon'

export const HomeNavbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-white flex items-center px-2 pr-5 z-50">
      <div className="flex items-center gap-4 w-full">
        {/* menu and logo */}
        {/* flex-shrink is a CSS flexbox property that controls the shrinkage ratio（收缩比例） of a flex item when the container size decreases.
              0 → 不收缩
              1（默认值）→ 正常收缩
              > 1 → 按比例更快收缩
              < 1 → 按比例收缩得更慢
        */}
        <div className="flex items-center flex-shrink-0">
        <SidebarTrigger/>
        <Link href="/">
          <div className="p-4 flex items-center gap-1">
          <Image src="/logo.svg" width={32} height={32} alt="logo"/>
          <p className="text-lg font-semibold tracking-tight">MyTube</p>
          </div>
        </Link>
        </div>
        
        {/* Search bar  */}
        {/* 
        1 → flex-grow：放大系数为 1 → 容器变大时，元素会按比例均匀扩展。
        1 → flex-shrink：收缩系数为 1 → 容器变小时，元素会按比例均匀收缩。
        0% → flex-basis：初始大小为 0 → 元素默认占用 0 空间，完全依赖弹性扩展。
        */}
        <div className="flex-1 flex justify-center max-w-[720] mx-auto">
        <SearchInput/>
        </div>
        <div className="flex items-center mr-3">
          <NotificationIcon/>
        </div>
        <div className="flex-shrink-0 flex items-center gap-4">
          <AuthButton/>
        </div>
      </div>
    </nav>
    
  )
}
