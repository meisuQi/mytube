'use client';
import { Button } from '@/components/ui/button'
import { ClapperboardIcon, UserCircleIcon, UserIcon } from 'lucide-react'
import{UserButton,SignInButton,SignedIn,SignedOut} from "@clerk/nextjs";
import React from 'react'

export const AuthButton = () => {
  //Add different auth states
  return (
    <>
    {/* 登陆界面 */}
    <SignedIn>
      {/* Add menu items for Studio and User profile */}
      <UserButton>
        <UserButton.MenuItems>
          <UserButton.Link 
            label="My profile"
            href="/users/current"
            labelIcon={<UserIcon className="size-4"/>}
          />
          <UserButton.Link 
            label="Studio"
            href="/studio"
            labelIcon={<ClapperboardIcon className="size-4"/>}
          />
        </UserButton.MenuItems>
      </UserButton>
    </SignedIn>

    {/* 登出界面 */}
    <SignedOut>
      {/* mode="modal"登陆按钮悬浮在原页面，默认不设置为重定向到另一个新页面 */}
      <SignInButton mode="modal">
        <Button
    // The variant here is a custom prop of the Button component, used to specify the styling variant of the button.
    variant="outline"
    // /20 → Opacity level, ranging from 0 (fully transparent) to 100 (fully opaque), here it means 20% opacity.
    //[&_svg]:size-5 设置图标大小（按照该组件本身设置的那种方式）
    className='px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-500 border-blue-500/20 rounded-full 
    shadow-none [&_svg]:size-5'
    >
          <UserCircleIcon/>
            Sign in 
        </Button>
      </SignInButton>
    </SignedOut>
    </>
  )
}

