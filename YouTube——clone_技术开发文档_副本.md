# Modules

如何在 Next.js App Router 中使用 tRPC 和 React Query 实现高效的服务器端数据预取和客户端注水(Hydration)。

![image-20250615210114102](/Users/a1/Library/Application Support/typora-user-images/image-20250615210114102.png)

> ### 性能优势
>
> 1. **零客户端加载状态**
>    数据在服务器完成预取，客户端组件直接渲染最终状态
>
> 2. **最小化数据传输**
>    只传输序列化的查询状态，而非完整响应数据
>
> 3. **高效缓存利用**
>
>    ```tsx
>    // 客户端组件中使用缓存数据
>    const { data } = trpc.videos.getMany.useInfiniteQuery(...);
>    ```
>
>    客户端使用标准 useQuery hook，但数据已存在缓存中
>
> 4. **类型安全**
>    从 `appRouter` 继承完整类型，确保前后端类型一致
>
>    ### 适用场景
>
>    这种模式特别适合：
>
>    - 需要 SEO 的内容页面
>    - 数据密集型仪表盘
>    - 无限滚动列表
>    - 需要即时交互的页面
>
> 1. **敏感数据处理**
>    通过 `createTRPCContext` 控制数据访问权限
>
>    ```tsx
>    // 示例上下文创建
>    export const createTRPCContext = async (opts: { headers: Headers }) => {
>      const session = await getSession();
>      return {
>        session,
>        prisma,
>        ...opts
>      }
>    }
>    ```
>
> 2. **大体积数据优化**
>    对于大型数据集：
>
>    ```tsx
>    // 选择性预取关键字段
>    trpc.videos.getMany.prefetchInfinite({
>      select: ['id', 'title'] // 只取必要字段
>    });
>    ```
>
> 3. **错误处理**
>    在预取中添加错误边界：
>
>    ```tsx
>    try {
>      await trpc.query.prefetch();
>    } catch (error) {
>      // 处理或记录错误
>    }
>    ```

## Chapter 1 Set Up

![image-20250615163812665](/Users/a1/Library/Application Support/typora-user-images/image-20250615163812665.png)

## Requirements Analysis

The proposed design for the homepage layout divides the interface into three main sections: a top navigation bar, a sidebar with public and personal sub - sections, and a main content area. The top bar includes a YouTube - like icon (which returns users to the home page when clicked), a search input for displaying relevant video content upon keyword entry, and a sign - in button. Clicking the sign - in button **<u>triggers</u>** a login modal, **<u>enabling</u>** Google account authentication, and **<u>redirects</u>** users **<u>to</u>** the home page upon successful login. Logged - out users are also redirected to the home page after logging out. The sidebar enforces authentication - based access, where personal sections like history and playlists are **<u>only accessible to</u>** signed - in users, while public sections can be browsed **<u>without</u>** logging in. Additionally, a sign - up option is provided below the sign - in button, <u>**guiding**</u> new users <u>**to**</u> the registration page. The proposed use of Clerk technology aims to **<u>streamline</u>**(简化和优化) user management and authentication, <u>**supporting third - party logins**</u> and helping to implement the required access controls efficiently.

## How to design a Project file structure

turn to 如何成为一名合格的程序猿(架构师)? file

## Workflow

![image-20250616155157463](/Users/a1/Library/Application Support/typora-user-images/image-20250616155157463.png)

## Chapter 2 BASIC LAYOUT

![image-20250621155350698](/Users/a1/Library/Application Support/typora-user-images/image-20250621155350698.png)



### THE MOST BASIC LAYOUT(Full-screen layout)

I'm tring to keep inside of the app folder will be only routing files and create a src/modules to store components /hooks/api/server/utils

#### Identify  the navbar,sidebar,main sections position

##### create modules/home/layout/home-layout.tsx

```tsx
import { SidebarProvider } from "@/components/ui/sidebar";

interface HomeLayoutProps{
  //React.ReactNode:React 提供的最宽泛的子元素类型，几乎涵盖所有可能的子元素形式
  children:React.ReactNode;
}
export const HomeLayout=({children}:HomeLayoutProps)=>{
  return(
      {/* 让元素横向占满整个屏幕 */}
      <div className="w-full">
      <HomeNavbar/>
    	{/* 1 rem 等于16px */}
      <div className="flex min-h-screen pt-[4rem]">
        <HomeSidebar/>
        {/* 
        flex-1:让元素在 Flex 布局中自动填充剩余空间。 
        等价于 CSS: flex: 1 1 0%（增长系数=1，收缩系数=1，基础尺寸=0%）。
        如果父容器是 flex，该元素会占据其他兄弟元素剩余的空间。
        overflow-y-auto:
        控制垂直方向的内容溢出行为。
        当内容超出
        元素高度时，自动显示垂直滚动条；
        未溢出时隐藏滚动条。
        等价于 CSS: overflow-y: auto。
        */}
        <main className="flex-1 overflow-y-auto ">
          {children}
        </main>
      </div>
      </div>
  )
}
```

> | min-h-screen     |                                          |
> | :--------------- | :--------------------------------------- |
> | 场景             | 行为                                     |
> | **内容少于一屏** | 元素高度撑满整个屏幕                     |
> | **内容超过一屏** | 元素高度随内容扩展（大于屏幕高度）       |
> | **响应式变化**   | 随设备屏幕高度自动调整（手机/平板/桌面） |
>
> **与 `h-screen` 的区别**：
>
> - `h-screen` = `height: 100vh`（固定高度为视口高度）
> - `min-h-screen` = `min-height: 100vh`（高度可超过视口）
>
> 常用于**全屏布局容器**



> 当内容超过屏幕高度,能上下滑动页面以展现完整内容:overflow-y-auto
>
> 当确定好sidebar的位置后,main元素自动占据剩余空间,并按比例收缩:父元素 flex 子元素 flex-1
>
> ```html
>  <div className="flex min-h-screen pt-[4rem]">
>         <HomeSideBar/>
>         {/* 
>         flex-1:让元素在 Flex 布局中自动填充剩余空间。 
>         等价于 CSS: flex: 1 1 0%（增长系数=1，收缩系数=1，基础尺寸=0%）。
>         如果父容器是 flex，该元素会占据其他兄弟元素剩余的空间。
>         overflow-y-auto:
>         控制垂直方向的内容溢出行为。
>         当内容超出
>         元素高度时，自动显示垂直滚动条；
>         未溢出时隐藏滚动条。
>         等价于 CSS: overflow-y: auto。
>         */}
>         <main className="flex-1 overflow-y-auto ">
> ```

##### For tailwindCSS JIT,in tailwind.config.ts file add :

```ts
"./src/modules/**/*.{js,ts,jsx,tsx,mdx}",
```

##### make the sidebar and navbar static ,and the main section is dynamic

###### create src/app/(home)/layout.tsx

```tsx
import { HomeLayout } from "@/modules/home/layout/home-layout";

interface LayoutProps{
  children:React.ReactNode;
}

const layout=({children}:LayoutProps)=>{
  return (
    <HomeLayout>
      {children}
    </HomeLayout>
  )
}
export default layout
```

> children refers to the content of  src/app/(home)/page.tsx

### HOME_NAVBAR PART

#### create modules/home/component/ui/home-navbar/index.ts

This is the directory default entry file

##### THE MOST BASIC LAYOUT(navbar part)

###### identify the (menu icon & logo + searchInput + auth button ) three parts position of the navbar

```ts
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ModeToggle } from "../../../../theme/mode-toggle"
import Link from "next/link"
import Image from "next/image"

export const HomeNavBar=()=>{
  return(
    // h-16: 4rem 64px
    <nav className="fixed top-0 right-0 left-0 h-16 flex items-center px-2 pr-5 z-50">
      <div className="flex items-center gap-4 w-full ">
        {/* menu and logo and dark theme*/}
        <div className="flex items-center flex-shrink-0">
          <SidebarTrigger/>
          <ModeToggle/>
          <Link href="/">
            <div className="flex items-center gap-1 p-4">
              <Image
                src="/logo.svg"
                width={32}
                height={32}
                alt="logo"
              />
              <p
              className="text-lg font-semibold tracking-tight"
              >Mytubee</p>
            </div>
          </Link>
        </div>
        {/* SearchInput */}
        <div className="flex justify-center flex-1 flex-shrink-1 max-w-[720] mx-auto">
          <SearchInput/>
        </div>
				{/* Notifications */}
        <div className="flex-shrink-0 flex items-center gap-2">
          <Notifications/>
        </div>
        {/* Auth button */}
        <div className="flex flex-shrink-0 items-center gap-4">
          <AuthButton/>
        </div>
      </div>
    </nav>
  )
}
```

> nav嵌套div的主要作用：
>
> **布局控制层**
>
> - 外层`nav`负责**定位和整体样式**（固定定位、背景色、高度等）
> - 内层`div`负责**内部内容的排列**（flex布局、间距、宽度控制）
>
> **解决定位元素的宽度限制**
>
> - `fixed`定位元素会脱离文档流，默认宽度是内容宽度
> - `w-full`确保内层div占满`nav`的全部可用宽度
> - 不加这个div，内部元素可能无法自动扩展宽度
>
> **内边距隔离**
>
> - 外层`nav`有`px-2 pr-5`内边距
> - 嵌套div防止内边距影响布局算法
>
> **响应式扩展性**
>
> - 未来添加响应式布局更灵活
>
> **语义分离**
>
> - `<nav>` 标签定义导航区域（语义）
> - `<div>` 纯粹处理视觉布局（无语义）
>
> ### 如果去掉嵌套div会怎样？(实际对比)
>
> | 有嵌套div                       | 无嵌套div                       |
> | :------------------------------ | :------------------------------ |
> | https://i.imgur.com/5Xa3kZl.png | https://i.imgur.com/9zjwRqL.png |
> | 内部元素间距均匀                | 间距受父级padding影响           |
> | 内容区域宽度可控                | 宽度可能超出预期                |
> | 布局逻辑清晰                    | flex布局直接受外层限制          |



> <SidebarTrigger/> 组件的目的是为了可以收缩侧边栏的items,来自shadcn 组件
>
> <ModeToggle/>组件是为了更改应用的主题
>
> <Link href="/">& <Image> 放置logo和应用名称,点击可以回到首页
>
> tracking-tight
>
> - **效果**：减少字符间的水平间距
> - **适用场景**：标题、大字号文本等需要紧凑排版的场景
> - **对比**：
>   - `tracking-tighter`：更紧凑（-0.05em）
>   - `tracking-tight`：紧凑（-0.025em）
>   - `tracking-normal`：默认间距（0em）
>   - `tracking-wide`：宽松（0.025em）
>
>  <SearchInput/>是输入框组件,希望其水平居中,最大宽度是720,空间不足时可以缩小宽度
>
> <AuthButton/>是用户登录、登出等组件,不允许收缩（保持按钮完整).垂直居中,按钮与导航栏高度匹配,不需要水平居中（靠右显示）

#### NOW,WRITE THE SPECIFIC COMPONENTS

##### ModeToggle

###### create modules/theme/theme-provider.tsx

```tsx
"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
```

###### create modules/theme/mode-toggle.tsx

```tsx
"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ModeToggle() {
  const { setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

###### src/app/layout.tsx

In RootLayout,use <ThemeProvider> to wrap the   children ,and add suppressHydrationWarning within <html>

```tsx
eturn (
    <html lang="en" suppressHydrationWarning>
      <body>
      <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
        {children}
        </ThemeProvider>
      </body>
    </html>
    
  );
```

##### SEARCHINPUT

###### create modules/home/component/ui/home-navbar/search-input.tsx

```tsx
import { SearchIcon } from 'lucide-react'
import React from 'react'

export const SearchInput = () => {
  //TODO:Add search functionality
  return (
   <form className="flex w-full max-w-[600px]">
    <div className='relative w-full'>
      <input 
      type="text"
      placeholder="Search"
      className="w-full pl-4 py-2 pr-12 rounded-l-full border focus:outline-none focus:border-blue-500"  
      />
      {/* TODO:add remove search button */}
    </div>
    <button 
    type="submit"
    className='px-5 py-2.5 bg-muted border border-l-0 rounded-r-full hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed'
    >
      <SearchIcon className="size-5"/>
    </button>
   </form>
  )
}
```

##### NOTIFICATIONS

###### Create modules/notifications/ui/components/index.tsx

```tsx
import { BellIcon } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

export const Notifications= () => {
  return (
    <Link href="/notifications">
      <div className="relative">
        <BellIcon className="h-6 w-6" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full h-4 w-4 flex items-center justify-center text-xs">
            0
          </span>
      </div>
    </Link>
  )
}
```

##### AUTHBUTTON

###### create modules/auth/ui/components/auth-button.tsx

```tsx
import { Button } from '@/components/ui/button'
import { UserCircleIcon } from 'lucide-react'
import React from 'react'

export const AuthButton = () => {
  return (
    // [&_svg]:size-5':对当前元素内部的所有 SVG 元素(即这里的 <UserCircleIcon/>)应用 size-5 样式 size-5 通常等同于 h-5 w-5（设置宽高为 1rem）"
   <Button
    variant="outline"
    className='px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-500 border-blue-500/20 rounded-full shadow-none [&_svg]:size-5'
   >
    <UserCircleIcon/>
      Sign in 
   </Button>
  )
}
```

### SIDE_BAR PART

#### create modules/home/component/ui/home-sidebar/index.tsx

```tsx
import { Separator } from '@/components/ui/separator'
import { SidebarContent,Sidebar } from '@/components/ui/sidebar'
import React from 'react'
import { MainSection } from './main-section'
import { PersonalSection } from './personal-section'

export const HomeSidebar = () => {
  
  return (
      <Sidebar className="pt-16 z-40 border-none"collapsible='icon'>
        <SidebarContent className="bg-background">
          <MainSection/>
          <Separator/>
          <PersonalSection/>
        </SidebarContent>
      </Sidebar>

    
  )
}
```

#### main-section

##### create modules/home/component/ui/home-sidebar/main-section.tsx

```tsx
"use client"
import { SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar'
import { FlameIcon, HomeIcon, PlaySquareIcon } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

export const MainSection = () => {
  const items=[
    {
      title:"Home",
      url:"/",
      icon:HomeIcon
    },
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
  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item)=>(
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton 
              tooltip={item.title}
              asChild
              isActive={false}
              onClick={()=>{}}
              >
                <Link href={item.url} className="flex items-center gap-4">
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
```

##### create modules/home/component/ui/home-sidebar/personal-section.tsx

```tsx
"use client"
import { SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar'
import { FlameIcon, HistoryIcon, HomeIcon, ListVideoIcon, PlaySquareIcon, ThumbsUp } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

export const PersonalSection = () => {
  const items=[
    {
      title:"History",
      url:"/playlists/history",
      icon:HistoryIcon,
      auth:true,
    },
    // this page will only be rendered to authorized users,because this is used to load videos from your subscriptions,if you are not logged ,you don't have any subscriptions  
    {
      title:"Liked videos",
      url:"/playlists/liked",
      icon:ThumbsUp,
      auth:true,
    },
    {
      title:"All playlists",
      url:"/playlists",
      icon: ListVideoIcon,
      auth:true,
    }
  ]
  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item)=>(
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton 
              tooltip={item.title}
              asChild
              isActive={false}
              onClick={()=>{}}
              >
                <Link href={item.url} className="flex items-center gap-4">
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
```

## Chapter 3 BASIC AUTH

## Workflow

![image-20250626212601418](/Users/a1/Library/Application Support/typora-user-images/image-20250626212601418.png)

![image-20250626205820554](/Users/a1/Library/Application Support/typora-user-images/image-20250626205820554.png)

![image-20250626205904617](/Users/a1/Library/Application Support/typora-user-images/image-20250626205904617.png)

https://clerk.com/docs/quickstarts/nextjs

## Install `@clerk/nextjs`

bun add @clerk/nextjs

## Add `clerkMiddleware()` to your app

### Create middleware.ts

```ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtectedRouter=createRouteMatcher([
  //  add the routes url you want to protect
     '/studio(.*)',
  ])
   export default clerkMiddleware(async(auth,req)=>{
    //
     if(isProtectedRouter(req)) await auth.protect();
   }); 

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
```

> **Logged-in Users**
>
> - 请求被放行，正常访问受保护页面
> - Requests are allowed to proceed to the protected page
>- 用户信息会附加到请求对象中（可通过 `auth()` 获取）
> - User information is attached to the request object (accessible via `auth()`)
> 
> **Non-logged-in Users**
> 
>- 自动重定向到登录页面（默认 /sign-in）
> - Automatically redirected to login page (default /sign-in)
> - 对于 API 请求返回 401 Unauthorized 错误
>- Returns 401 Unauthorized error for API requests

## Add ` <ClerkProvider>` and Clerk components to your app

```tsx
import { ThemeProvider } from "@/modules/theme/theme-provider";
import {ClerkProvider} from  '@clerk/nextjs';


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // This component provides Clerk's authentication context to your app.
    <ClerkProvider afterSignOutUrl='/'>
    <html lang="en" suppressHydrationWarning>
      <body>
      <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
        {children}
        </ThemeProvider>
      </body>
    </html>
    </ClerkProvider>
  );
}
```

## Set  Clerk API keys

### create .env.local

```.env.local
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_Y3VyaW91cy1nZWxkaW5nLTQzLmNsZXJrLmFjY291bnRzLmRldiQ

CLERK_SECRET_KEY=sk_test_Vd1mBXaCGPBv6rzrqndKyteH19Out34EwneNkhtCtN
```

> NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
>
> **Client-side Authentication**:`ClerkProvider` uses this key to initialize the authentication service
>
> When using the @clerk/nextjs library on the frontend, the publishableKey links your project to Clerk's backend services

> CLERK_SECRET_KEY:
>
> **Verifying Webhook Signatures**:`CLERK_SECRET_KEY` is used for verifying webhook signatures to ensure data source authenticity
>
> **Server-side User Operations**:Querying user information and managing user identities

## Build your own sign-in-or-up page for your Next.js app with Clerk

### Build a sign-in page

#### create app/(auth)/sign-in/[[...sign-in]]/page.tsx

```tsx
import { SignIn } from '@clerk/nextjs'

export default function Page() {
  return <SignIn />
}
```

### Build a sign-up page

#### create app/(auth)/sign-up/[[...sign-up]]/page.tsx

```tsx
import { SignUp } from '@clerk/nextjs'

export default function Page() {
  return <SignUp />
}
```

### create app/(auth)/ layout.tsx

```tsx
import React from 'react'

interface LayoutProp{
  children:React.ReactNode
}

const Layout = ({children}:LayoutProp) => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      {children}
      </div>
  )
}

export default Layout
```

### Update environment variables

##### .env.local

```.env.local
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
```

> - | `CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` | The fallback URL to redirect to after the user signs in, if there's no `redirect_url` in the path already. Defaults to `/`. |
>   | ------------------------------------- | ------------------------------------------------------------ |
>   | CLERK_SIGN_UP_FALLBACK_REDIRECT_URL   | The fallback URL to redirect to after the user signs up, if there's no `redirect_url` in the path already. Defaults to `/`. |

## Create SignIn & SignOut Button

https://clerk.com/docs/components/user/user-button

### src/modules/auth/ui/components/auth-button.tsx

```tsx
import { Button } from '@/components/ui/button'
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs'
import { UserCircleIcon } from 'lucide-react'
import React from 'react'

export const AuthButton = () => {
  return (
    <>
    <SignedIn>
        <UserButton />
      </SignedIn>

    <SignedOut>
      <SignInButton mode="modal">
      {/* [&_svg]:size-5':对当前元素内部的所有 SVG 元素(即这里的 <UserCircleIcon/>)应用 size-5 样式 size-5 通常等同于 h-5 w-5（设置宽高为 1rem）" */}
        <Button
          variant="outline"
          className='px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-500 border-blue-500/20 rounded-full shadow-none [&_svg]:size-5'
        >
          <UserCircleIcon/>
            Sign in 
        </Button>
    </SignInButton>
   </SignedOut>
   </>
  )
}
```

## if a user didn't sign-in and clicked the auth=true sidebar item,it will direct to the sign-in page ,and after successfully signed in ,it can browse the related contents

we can use useClerk and useAuth to complete this function

### src/modules/home/ui/components/home-sidebar/main-section.tsx

```tsx
export const MainSection = () => {
  const clerk=useClerk();
  const {isSignedIn}=useAuth();
  return (
  <SidebarMenuButton
                tooltip={item.title}
                asChild
                isActive={pathname===item.url}//TODO:Change to look at current pathname
                onClick={(e)=>{
                  if(!isSignedIn && item.auth){
                    e.preventDefault();
                    return clerk.openSignIn();
                  }
                }}
              >
              )
              }
```

### src/modules/home/ui/components/home-sidebar/personal-section.tsx

```tsx
export const PersonalSection = () => {
  const clerk=useClerk();
  const {isSignedIn}=useAuth();
  return (
  <SidebarMenuButton
                tooltip={item.title}
                asChild
                isActive={pathname===item.url}//TODO:Change to look at current pathname
                onClick={(e)=>{
                  if(!isSignedIn && item.auth){
                    e.preventDefault();
                    return clerk.openSignIn();
                  }
                }}
              >
              )
              }
```

# Chapter 4 Database Setup

## Workflow

![image-20250629104750805](/Users/a1/Library/Application Support/typora-user-images/image-20250629104750805.png)

## Requirements analysis

- create a postgreSOL database
- Setup drizzle ORM
- create user schema
- migrate changes to database

## Create a postgreSOL database

https://console.neon.tech/app/projects/royal-bush-72359408?database=my-tubee

## Setup drizzle ORM

### Step 1 - Install **@neondatabase/serverless** package

```
bun add drizzle-orm@0.39.0 @neondatabase/serverless@0.10.4 dotenv@16.4.7

bun add -D drizzle-kit@0.30.3 tsx@4.19.2
```

### Step 2 - Setup connection variables

#### .env.local

```
DATABASE_URL=postgresql://my-tubee_owner:npg_EY0l4jHKMdQP@ep-raspy-violet-a8xpm21e-pooler.eastus2.azure.neon.tech/my-tubee?sslmode=require&channel_binding=require
```

### Step 3 - Connect Drizzle ORM to the database

#### create src/db/index.ts

```ts
//Connect Drizzle ORM to the database
import { drizzle } from 'drizzle-orm/neon-http';
const db = drizzle(process.env.DATABASE_URL!);
```

> /* 
>
> 报错:类型“[string | undefined]”的参数不能赋给类型“[string | NeonQueryFunction<any, any>] | [string | NeonQueryFunction<any, any>, DrizzleConfig<Record<string, never>>] | [...]”的参数。
>   不能将类型“[string | undefined]”分配给类型“[string | NeonQueryFunction<any, any>] | [DrizzleConfig<Record<string, never>> & ({ connection: string | ({ connectionString: string; } & HTTPTransactionOptions<...>); } | { ...; })]”。
>     不能将类型“[string | undefined]”分配给类型“[string | NeonQueryFunction<any, any>]”。
>       不能将类型“string | undefined”分配给类型“string | NeonQueryFunction<any, any>”。
>         不能将类型“undefined”分配给类型“string | NeonQueryFunction<any, any>”。ts(2345)
>
> string | undefined
>
> 使用 drizzle 初始化数据库连接。
> 通过环境变量 process.env.DATABASE_URL 获取数据库的连接地址。
> 使用 ! 非空断言运算符，告诉 TypeScript 编译器 DATABASE_URL 不会为 null 或 undefined，确保不会报错。
> 将数据库连接对象赋值给 db，用于后续查询和操作。 */ 

### Step 4 - Create a user table

#### Create src/db/schema/users.ts

```ts
import { pgTable, text, uuid } from "drizzle-orm/pg-core";

export const users=pgTable('users',{
  id:uuid().primaryKey().defaultRandom(),
  name:text().notNull(),
  clerkId:text("clerk_id").unique().notNull(),
  imageUrl:text("image_url").notNull(),
})
```

> ![IMG_4055](/Users/a1/Downloads/IMG_4055.jpg)

### Step 5 - Setup Drizzle config file

#### Create drizzle.config.ts

```ts
import 'dotenv/config';
import dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

dotenv.config({ path: ".env.local" });   // 确保加载环境变量

console.log("ENV DATABASE_URL:", process.env.DATABASE_URL);
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined in .env.local");
}

export default defineConfig({
  // 指定 Drizzle ORM 生成的迁移文件和数据库文件的输出目录。所有的数据库迁移和相关文件会生成在 drizzle 文件夹中。
  out: './drizzle',
  // 指定数据库架构文件路径。包含表结构、字段定义、索引等。
  schema: './src/db/schema.ts',
  // 指定数据库的类型为 PostgreSQL。
  dialect: 'postgresql',
  // 指定数据库的连接信息，读取环境变量 DATABASE_URL 中的数据库连接字符串。! → 表示非空断言，表示该变量不会为空。
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

### Step 6 - Applying changes to the database

```
bunx drizzle-kit push
```

### Step 7 - Install Drizzle Studio

```
bunx drizzle-kit studio
```

# Chapter 5 webhook sync

## Workflow

![image-20250630121452671](/Users/a1/Library/Application Support/typora-user-images/image-20250630121452671.png)

Webhook Sync primarily refers to **ensuring that webhook events remain consistent with the state of a database or application**. It typically involves **listening for, validating, storing, and processing webhook events** to prevent loss or duplicate execution.  

**Webhook Events**: A webhook event functions similarly to a "callback function." When a **specific event occurs**, an external service automatically sends an HTTP request (typically a `POST` request) to **your designated endpoint**.  

- **Webhook events typically include**:  
  1. **Event Type** (`eventType`): Identifies the nature of the event, such as `user.created` (user creation) or `payment.success` (successful payment).  
  2. **Event Data** (`data`): Contains detailed information about the event, such as user ID or transaction amount.  
  3. **Security Signature** (`signature`): Used to verify the authenticity of the webhook event, ensuring it originates from a trusted external service and preventing forged requests.

## Install ngrok 

a local tunnel that can expose our localhost app  to the public , allowing the thrid part server to access our app

https://dashboard.ngrok.com/get-started/setup/macos

```
brew install ngrok
```

### Configure  `ngrok config add-authtoken 2vhrbpW2XSJmnk5hcFcckEPOug5_5XuTnsacLCmVr3SZBMjjD ` in our terminal

The role of the `ngrok authtoken`:  

- **Authentication** – Connects `ngrok` to your account.  
- **Unlocks more features** (such as longer-lasting tunnels and unrestricted connections).  
- **Stores the `authtoken`** – No need to manually log in every time you start `ngrok`.

![image-20250629113144034](/Users/a1/Library/Application Support/typora-user-images/image-20250629113144034.png)

### Create static domain

Domains->create Domin

```
ngrok http --domain=cuddly-wasp-utterly.ngrok-free.app 3000
```

> Error:
> a1@1deMacBook-Air mytubee % ngrok authtoken 2v2CewcIfUxtEwnaJCg0eDpAzlj_RWhS1WnSpkGP6PUTQzn8
> Authtoken saved to configuration file: /Users/a1/Library/Application Support/ngrok/ngrok.yml
> a1@1deMacBook-Air mytubee % ngrok http --domain=cuddly-wasp-utterly.ngrok-free.app 3000
> ERROR:  authentication failed: Usage of ngrok requires a verified account and authtoken.
> ERROR:  
> ERROR:  Sign up for an account: https://dashboard.ngrok.com/signup
> ERROR:  Install your authtoken: https://dashboard.ngrok.com/get-started/your-authtoken
> ERROR:  
> ERROR:  ERR_NGROK_4018
> ERROR:  https://ngrok.com/docs/errors/err_ngrok_4018
> ERROR:  

> Solution:
>
> delete ngrok
>
> ```
> brew uninstall ngrok
> 
> rm -rf "$HOME/Library/Application Support/ngrok"
> 
> ```
>
> repeate the install processess

Finally, we get the static domain

```
https://cuddly-wasp-utterly.ngrok-free.app
```

## Install concurrently

Ensure multiple threads, process or tasks can be executed at the same time

```
bun add concurrently@9.1.2
```

### Package.json

```json
"scripts": {
  	"dev:all":"concurrently \"bun run dev:webhook\" \"bun run dev\" ",
    "dev": "next dev",
    "dev:webhook":"ngrok http --url=cuddly-wasp-utterly.ngrok-free.app 3000",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
```

## Configure clerk webhook

### Clerk-->web hook-->endpoints-->add endpoints

这里应该是https

![image-20250629143134772](/Users/a1/Library/Application Support/typora-user-images/image-20250629143134772.png)

### Click Signing Secert

![image-20250629143325896](/Users/a1/Library/Application Support/typora-user-images/image-20250629143325896.png)

.env.local

```
CLERK_SIGNING_SECRET=whsec_0sMFt1I7MZbowbjR45kzDIumXbM3kU3P
```

### `view docs`-->Sync Clerk data to your application with webhook

#### Install `svix`

Clerk uses [`svix`⁠](https://www.npmjs.com/package/svix) to deliver webhooks, so you'll use it to verify the webhook signature. Run the following command in your terminal to install the package:

```
bun add svix@1.45.1
```

#### Create the Endpoint	

Set up a Route Handler that uses `svix` to verify the incoming Clerk webhook and process the payload.

##### create src/app/api/users/webhook/route.ts

same with 

![image-20250629145249092](/Users/a1/Library/Application Support/typora-user-images/image-20250629145249092.png)

```ts
import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { users } from '@/db/schema'
import { db } from '@/db'
import { eq } from 'drizzle-orm'

export async function POST(req: Request) {
  const SIGNING_SECRET = process.env.SIGNING_SECRET

  if (!SIGNING_SECRET) {
    throw new Error('Error: Please add SIGNING_SECRET from Clerk Dashboard to .env or .env')
  }

  // Create new Svix instance with secret
  const wh = new Webhook(SIGNING_SECRET)

  // Get headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error: Missing Svix headers', {
      status: 400,
    })
  }

  // Get body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  let evt: WebhookEvent

  // Verify payload with headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error: Could not verify webhook:', err)
    return new Response('Error: Verification error', {
      status: 400,
    })
  }

  // Do something with payload
  // For this guide, log payload to console
 
  const eventType = evt.type
  if(eventType==="user.created"){
    const {data} = evt;
    await db.insert(users).values({
        clerkId:data.id,
        name:`${data.first_name} ${data.last_name}`,
        imageUrl:data.image_url,
    })
  }
  if(eventType==="user.deleted"){
    const{data}=evt;
    if(!data.id){
      return new Response("Missing user id",{status:400})
    }
    await db.delete(users).where(eq(users.clerkId,data.id))
  }
  if(eventType==="user.updated"){
    const {data} = evt;
    await db.update(users).set({
      name:`${data.first_name} ${data.last_name}`,
      imageUrl:data.image_url,
    }).where(eq(users.clerkId,data.id));
  }
  return new Response('Webhook received', { status: 200 })
} 
```

![image-20250629151539177](/Users/a1/Library/Application Support/typora-user-images/image-20250629151539177.png)

# Chapter6 TRPC setup

tRPC is a **fully type-safe communication framework** for full-stack TypeScript applications. It allows the frontend to call backend functions **without writing API routes** or manually defining types.

## 1.Install deps

```
bun add @trpc/server @trpc/client @trpc/react-query @tanstack/react-query@latest zod client-only server-only
```

## 2.Create a tRPC router

### src/trpc/init.ts

```ts
import { initTRPC } from '@trpc/server';
import { cache } from 'react';
export const createTRPCContext = cache(async () => {
  return { userId: 'user_123' };
});

const t = initTRPC.create({
  // transformer: superjson,
});
// Base router and procedure helpers
export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;
```

### create src/trpc/routers/_app.ts

```ts
import { z } from 'zod';
import { baseProcedure, createTRPCRouter } from '../init';
export const appRouter = createTRPCRouter({
  hello: baseProcedure
    .input(
      z.object({
        text: z.string(),
      }),
    )
    .query((opts) => {
      return {
        greeting: `hello ${opts.input.text}`,
      };
    }),
});
// export type definition of API
export type AppRouter = typeof appRouter;
```

### create src/app/api/trpc/[trpc]/route.ts

```ts
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { createTRPCContext } from '~/trpc/init';
import { appRouter } from '~/trpc/routers/_app';
const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: createTRPCContext,
  });
export { handler as GET, handler as POST };
```

## 3.Create a Query Client factory

### create trpc/query-client.ts

```ts
import {
  defaultShouldDehydrateQuery,
  QueryClient,
} from '@tanstack/react-query';
//import superjson from 'superjson';
//创建QueryClient 实例：
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
      },
      dehydrate: {
        // serializeData: superjson.serialize,
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === 'pending',
      },
      hydrate: {
        // deserializeData: superjson.deserialize,
      },
    },
  });
}
```

## 4.Create a tRPC client for Client Components

### create src/trpc/client.tsx

```tsx
'use client';
// ^-- to make sure we can mount the Provider from a server component
import type { QueryClient } from '@tanstack/react-query';
import { QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import { useState } from 'react';
import { makeQueryClient } from './query-client';
import type { AppRouter } from './routers/_app';
export const trpc = createTRPCReact<AppRouter>();
let clientQueryClientSingleton: QueryClient;
function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return makeQueryClient();
  }
  // Browser: use singleton pattern to keep the same query client
  return (clientQueryClientSingleton ??= makeQueryClient());
}
function getUrl() {
  const base = (() => {
    if (typeof window !== 'undefined') return '';
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
    return 'http://localhost:3000';
  })();
  return `${base}/api/trpc`;
}
export function TRPCProvider(
  props: Readonly<{
    children: React.ReactNode;
  }>,
) {
  // NOTE: Avoid useState when initializing the query client if you don't
  //       have a suspense boundary between this and the code that may
  //       suspend because React will throw away the client on the initial
  //       render if it suspends and there is no boundary
  const queryClient = getQueryClient();
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          // transformer: superjson, <-- if you use a data transformer
          url: getUrl(),
        }),
      ],
    }),
  );
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {props.children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
```

### Root Layout.tsx

```tsx
return (
    <ClerkProvider afterSignOutUrl='/'>
    <html lang="en">
      <body
      // inter.className itself is a string ,so we don't need template literal here,but like inter.variable ,this is a JS express not a string, we need to use template literal to wrap it.
        className={inter.className}
      >
        <TRPCProvider>
        {children}
        </TRPCProvider>
      </body>
    </html>
    </ClerkProvider>
  );
```

## 5.Create a tRPC caller for Server Components

### create src/trpc/server.tsx

```tsx
import 'server-only'; // <-- ensure this file cannot be imported from the client
import { createHydrationHelpers } from '@trpc/react-query/rsc';
import { cache } from 'react';
import { createCallerFactory, createTRPCContext } from './init';
import { makeQueryClient } from './query-client';
import { appRouter } from './routers/_app';
// IMPORTANT: Create a stable getter for the query client that
//            will return the same client during the same request.
export const getQueryClient = cache(makeQueryClient);
const caller = createCallerFactory(appRouter)(createTRPCContext);
export const { trpc, HydrateClient } = createHydrationHelpers<typeof appRouter>(
  caller,
  getQueryClient,
);
```

> `cache()` 让函数在**同一次服务器请求（SSR/SSG）中复用相同的值**，防止重复创建实例。

## 6.Prefetch data in server components

### src/app/(home)/page.tsx

```tsx
import { HydrateClient, trpc } from '@/trpc/server';
import React, { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { PageClient } from './client';
export const dynamic ="force-dynamic";
const Page = async () => {
  void trpc.hello.prefetch({text:"meisu"})
  return (
   <div>
    <HydrateClient>
      <Suspense fallback={<p>Loading...</p>}>
        <ErrorBoundary fallback={<p>Error...</p>}>
          <PageClient/>
        </ErrorBoundary>
      </Suspense>
    </HydrateClient>
   </div>
  )
}

export default Page
```

## 7.get the cached data in client components

### src/app/(home)/client.tsx

```tsx
"use client"
import { trpc } from '@/trpc/client'
import React from 'react'

export const PageClient = () => {
  const [data]=trpc.hello.useSuspenseQuery({
    text:"meisu"
  })
  return (
    <div>client side says:{data.greeting}</div>
  )
}

```

## 8.The whole process

Prepare stage:

📍 Location: init.ts, query-client.tsx, server.tsx

```ts
// init.ts
export const createTRPCContext = cache(async () => {
  return { userId: 'user_123' }; // Context creation function
});
```

```tsx
// query-client.tsx
export function makeQueryClient() {
  return new QueryClient({ // Create React Query client
    defaultOptions: { queries: { staleTime: 30 * 1000 } }
  });
}
```

```tsx
// server.tsx
export const getQueryClient = cache(makeQueryClient); // Cache QueryClient
const caller = createCallerFactory(appRouter)(createTRPCContext); // Create server caller
export const { trpc, HydrateClient } = createHydrationHelpers(...); // RSC utilities
```

🧠 Purpose:  
1. Define global context creation function (`createTRPCContext`)  
2. Configure React Query client  
3. Create RSC (React Server Components) utilities

![image-20250630214828078](/Users/a1/Library/Application Support/typora-user-images/image-20250630214828078.png)

# Chapter 7 TRPC configuration 

## Workflow

![image-20250703141449124](/Users/a1/Library/Application Support/typora-user-images/image-20250703141449124.png)

## 1.Enable transformer on trpc

```
bun add superjson@2.2.2
```

 uncomment init.ts/query-client.ts/client.tsx

## 2.Add Auth to trpc context & Add protectedProcedure

Inject user's info into every API request context,then the procedure can access to user permissions through context

> When initializing your router, tRPC allows you to:
>
> - Setup [request contexts](https://trpc.io/docs/server/context)
> - Assign [metadata](https://trpc.io/docs/server/metadata) to procedures
> - [Format](https://trpc.io/docs/server/error-formatting) and [handle](https://trpc.io/docs/server/error-handling) errors
> - [Transform data](https://trpc.io/docs/server/data-transformers) as needed
> - Customize the [runtime configuration](https://trpc.io/docs/server/routers#runtime-configuration)

### src/trpc/init.ts

```ts
import { db } from '@/db';
import { users } from '@/db/schema/users';
import { auth } from '@clerk/nextjs/server';
import { TRPCError, initTRPC } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { cache } from 'react';
import superjson from 'superjson';

//create tRPC context
export const createTRPCContext = cache(async () => {
  const{userId}= await auth();
  return {clerkUserId:userId}
});

//define tRPC  Context type
export type Context=Awaited<ReturnType<typeof createTRPCContext>>

//init tRPC server and pass Context,enabling every API endpoint can access to clerkUserId
const t = initTRPC.context<Context>().create({
  transformer: superjson,
}); 
// Base router and procedure helpers
export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;

//add protectedProcedure 
  export const protectedProcedure=t.procedure.use(async function isAuthed(opts){
    //to check if a user is logged in or not
    const {ctx}=opts;
    if(!ctx.clerkUserId){
      throw new TRPCError({code:"UNAUTHORIZED"})
    }
    //
    const [user]=await db
         .select()
         .from(users)
         .where(eq(users.clerkId,ctx.clerkUserId))     
         .limit(1)
        if(!user){
          throw new TRPCError({code:"UNAUTHORIZED"})
        }     

    return opts.next({
      ctx:{
        ...ctx,
        user,
      }
    })    
  })

```

![image-20250702145521608](/Users/a1/Library/Application Support/typora-user-images/image-20250702145521608.png)

## 3.change baseProcedure to protectedProcedure

### _app.ts

```ts
import { z } from 'zod';
import { baseProcedure, createTRPCRouter, protectedProcedure } from '../init';
import { TRPCError } from '@trpc/server';
export const appRouter = createTRPCRouter({
  hello: protectedProcedure
    .input(
      z.object({
        text: z.string(),
      }),
    )
    .query((opts) => {  
      console.log({fromContext:opts.ctx.clerkUserId});
      return {
        greeting: `hello ${opts.input.text}`,
      };
    }),
});
// export type definition of API
export type AppRouter = typeof appRouter;
```

### 4.add rate limiting

```
bun add @upstash/redis@1.34.3
bun add @upstash/ratelimit@2.0.5
```

![image-20250703115450784](/Users/a1/Library/Application Support/typora-user-images/image-20250703115450784.png)

#### Create a new redis

##### src/lib/redis.tsx

```ts
import {Redis} from '@upstash/redis';
const redis=new Redis({
  url:process.env.UPSTASH_REDIS_REST_URL,
  token:process.env.UPSTASH_REDIS_REST_TOKEN,
})
```

#### create a limiter

##### src/lib/ratelimit.ts

```ts
import {Ratelimit} from "@upstash/ratelimit";
import {redis} from './redis';
/* 这是设置限流策略，采用的是滑动窗口算法（sliding window）。
语义是：在任意连续的 10 秒内，最多允许 10 次请求。
如果用户在 10 秒内发了超过 10 次请求，就会被拦截（返回 TOO_MANY_REQUESTS 错误）。 */
export const ratelimit=new Ratelimit({
  redis,
  limiter:Ratelimit.slidingWindow(10,'10s')
})
```

# Chapter 8 Video Categories 

## Requirements

 we will give this categories a carousel effect,which means that when I click the left or right button ,it will display the next category until reach the first or the last one

when I click a specific category button ,it background color will trun to black ,and the url will add the categoryId ,but for All button ,the url won't change.

## Workflow

![image-20250706153439681](/Users/a1/Library/Application Support/typora-user-images/image-20250706153439681.png)

## 1.Create src/db/schema/categories.ts

```ts
import { pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

export const categories=pgTable("categories",{
  id:uuid('id').primaryKey().defaultRandom(),
  name:text('name').notNull().unique(),
  description:text('description'),
  createdAt:timestamp('created_at').defaultNow().notNull(),
  updatedAt:timestamp('updated_at').defaultNow().notNull(),
},(t)=>[uniqueIndex('name_idx').on(t.name)])
```

## 2.Seed Categories

### src/scripts/seed-categories.ts

```ts
import { db } from "@/db"
import { categories } from "@/db/schema/categories"


const categoryNames=[
  "Eduction",
  "Gaming",
  "Film and animation",
  "Music",
  "Science and Technology",
  "Pets and Animals",
  "Sports",
  "Travel and events",
  "News and politics",
  "Vlog",
  "Podcasts",
  "Study Skills"
]

async function main(){
  try{
    const values=categoryNames.map((name)=>({
      name,
      description:`Videos related to ${name.toLowerCase()} `
    }))
    await db.insert(categories).values(values)
  }catch(error){
    console.error("Error seeding categories: ",error);
    process.exit(1)
  }
}

main();
```

## 3.Create src/modules/categories/server/procedures.ts

```ts
import { db } from "@/db";
import { categories } from "@/db/schema/categories";
import { baseProcedure, createTRPCRouter } from "@/trpc/init";


export const categoryRouter=createTRPCRouter({
  getMany:baseProcedure.query(async()=>{
    const data=await db.select().from(categories)
    return data;
  })
})
```

## 4.Create categories components

### src/app/(home)/page.tsx

```tsx
import { HydrateClient, trpc } from '@/trpc/server';
import React, { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { PageClient } from './client';
import { SearchParams } from 'next/dist/server/request/search-params';
import { HomeView } from '@/modules/home/ui/views/home-view';
export const dynamic ="force-dynamic";

interface PageProps{
  searchParams:Promise<{
    categoryId:string
  }>
}
const Page = async ({searchParams}:PageProps) => {
  const {categoryId}=await searchParams;
  void trpc.categories.getMany.prefetch();
  return (
   <HydrateClient>
    <HomeView categoryId={categoryId}/>
   </HydrateClient>
  )
}

export default Page
```

### Create src/modules/home/ui/views/home-view.tsx

```tsx
import { HydrateClient, trpc } from '@/trpc/server';
import React, { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { PageClient } from './client';
import { SearchParams } from 'next/dist/server/request/search-params';
import { HomeView } from '@/modules/home/ui/views/home-view';
export const dynamic ="force-dynamic";

interface PageProps{
  searchParams:Promise<{
    categoryId:string
  }>
}
const Page = async ({searchParams}:PageProps) => {
  const {categoryId}=await searchParams;
  void trpc.categories.getMany.prefetch();
  return (
   <HydrateClient>
    <HomeView categoryId={categoryId}/>
   </HydrateClient>
  )
}

export default Page
```

### Create src/modules/home/ui/sections/category-section.tsx

```tsx
"use client"
import { trpc } from '@/trpc/client';
import React from 'react'

interface categoriesSectionProps{
  categoryId:string;
}
export const CategoriesSection = ({categoryId}:categoriesSectionProps) => {
  const [categories]=trpc.categories.getMany.useSuspenseQuery()
  return (
    <div>{JSON.stringify(categories)}</div>
  )
}
```

## Adding loading pages

### Create src/modules/home/ui/sections/category-section.tsx

```tsx
"use client"
import { trpc } from '@/trpc/client';
import React, { Suspense } from 'react'
import { ErrorBoundary } from 'react-error-boundary';

interface categoriesSectionProps{
  categoryId:string;
}

export const CategoriesSection=({categoryId}:categoriesSectionProps)=>{
  <Suspense fallback={<p>Loading...</p>}>
    <ErrorBoundary fallback={<p>error...</p>}>
      <CategoriesSectionSuspense categoryId={categoryId}/>
    </ErrorBoundary>
  </Suspense>
}

const CategoriesSectionSuspense = ({categoryId}:categoriesSectionProps) => {
  const [categories]=trpc.categories.getMany.useSuspenseQuery()
  return (
    <div>{JSON.stringify(categories)}</div>
  )
}
```

## Design a nice ui

### modules/home/ui/sections/categories-section.tsx

```tsx
"use client";
import { trpc } from '@/trpc/client';
import {ErrorBoundary} from 'react-error-boundary';
import React, { Suspense } from 'react'
import { FilterCarousel } from '@/components/filter-carousel';
import { useRouter } from 'next/navigation';
interface CategoriesSectionProps{
  categoryId?:string;
};

export const CategoriesSection=({categoryId}:CategoriesSectionProps)=>{
  return (
    <Suspense fallback={<FilterCarousel isLoading data={[]} onSelect={()=>{}}/>}>
      <ErrorBoundary fallback={<p>Error...</p>}>
        <CategoriesSectionSuspense categoryId={categoryId}/>
      </ErrorBoundary>
    </Suspense>
  )
}
export const CategoriesSectionSuspense = ({categoryId}:CategoriesSectionProps) => {
  const router=useRouter();
  //we are now immediately going to access the cache which we have,thanks to this prefetch in our server component 
  const [categories]=trpc.categories.getMany.useSuspenseQuery()
  const data=categories.map(({name,id})=>({
    value:id,
    label:name
  }));
  const onSelect=(value:string|null)=>{
      const url=new URL(window.location.href);
      if(value){
        url.searchParams.set("categoryId",value);
      }else{
        url.searchParams.delete("categoryId")
  }
    router.push(url.toString())
}
  return <FilterCarousel onSelect={onSelect} value={categoryId} data={data}/>
}
```

### Create src/components/filter-carousel.tsx

```tsx
'use client';
import{
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
}from "@/components/ui/carousel"
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Skeleton } from "./ui/skeleton";
interface FilterCarouselProps{
  value?:string|null;
  isLoading?:boolean;
  onSelect:(value:string|null)=>void;
  data:{
    value:string;
    label:string;
  }[]
}

export const FilterCarousel=({
  value,
  isLoading,
  onSelect,
  data
}: FilterCarouselProps)=>{
  const [api,setApi]=useState<CarouselApi>();
  const [current,setCurrent]=useState(0);
  const [count,setCount]=useState(0);

  useEffect(()=>{
    if(!api){
      return; 
    }
    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap()+1);
    api.on("select",()=>{
      setCurrent(api.selectedScrollSnap()+1)
    })
  },[api])

  return(
    <div className="relative w-full">
      {/* Left fade */}
      <div
        className={cn(
          "absolute left-12 top-0 bottom-0 w-12 z-10 bg-gradient-to-r from-White to-transparent pointer-events-none",
          current===1&&"hidden"
        )}
      />
      <Carousel 
      /* 这是一个**“回调式获取实例引用”**的机制。
      意思是：Carousel 内部会在初始化完成后调用这个 setApi 函数，把它的控制器 CarouselApi 对象传出来。 */
      setApi={setApi}
      opts={{
        align:"start",
        dragFree:true
      }}
        className="w-full px-12"
      >
        <CarouselContent className="-ml-3">
          {!isLoading &&(
          <CarouselItem 
          //点击 "All" 标签时，会告诉外部组件说：我没有选择任何具体的分类，当前值是 null。
          onClick={()=>onSelect(null)}
          className="pl-3 basis-auto">
            <Badge
            variant={!value ? "default":"secondary"}
            className="rounded-lg px-3 py-1 cursor-pointer whitespace-nowrap text-sm" 
            >
              All
            </Badge>
          </CarouselItem>
          )}
          {isLoading &&
            Array.from({length:10}).map((_,index)=>(
              <CarouselItem key={index} className="pl-3 basis-auto">
                <Skeleton className="rounded-lg px-3 py-1 h-full text-sm w-[100px] font-semibold">
                  &nbsp;
                </Skeleton>
              </CarouselItem>
            ))
            }
          {!isLoading && data.map((item)=>(
            <CarouselItem key={item.value} 
              className="pl-3 basis-auto" 
              onClick={()=>onSelect(item.value)}>
              <Badge
              variant={value===item.value ? "default":"secondary"}
              className="rounded-lg px-3 py-1 cursor-pointer whitespace-nowrap text-sm" 
              >
                {item.label}
              </Badge>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-0 z-20"/>
        <CarouselNext className="right-0 z-20"/>
      </Carousel>
      {/* Right fade */}
      <div
        className={cn(
          "absolute right-12 top-0 bottom-0 w-12 z-10 bg-gradient-to-l from-White to-transparent pointer-events-none",
          current===count&&"hidden"
        )}
      /> 
    </div>
  )
}
```

# Chapter 9 Studio layout

## Requirements

![image-20250710134850500](/Users/a1/Library/Application Support/typora-user-images/image-20250710134850500.png)

when I click the auth button from the home page, it will display the studio button for me ,and when I click the studio button ,it will direct me to the studio page, 

and this page's layout looks similar to home page,it means that it has navbar,sidebar,main contents three parts .

for navbar,it will have sidebar button ,icon&text in left, and add button and user button in right. when I click the icon ,it will return to studio page,and when I click the add button ,it will direct me to the page that I can upload and edit my videos .

In the sidebar , we have our user profile and Content and Exit Studio items

## Workflow

![image-20250712104455188](/Users/a1/Library/Application Support/typora-user-images/image-20250712104455188.png)

## Add menu items for studio and user profile

![image-20250711140858258](/Users/a1/Library/Application Support/typora-user-images/image-20250711140858258.png)

https://clerk.com/docs/customization/user-button

### src/modules/auth/ui/components/auth-button.tsx

```tsx
return (
    <>
    {/* 登陆界面 */}
    <SignedIn>
      {/* Add menu items for Studio and User profile */}
      <UserButton>
        <UserButton.MenuItems>
          <UserButton.Link 
            label="Studio"
            href="/studio"
            labelIcon={<ClapperboardIcon className="size-4"/>}
          />
        </UserButton.MenuItems>
      </UserButton>
    </SignedIn>
```

## Do basic studio layout

### Copy modules/home/ui/component and change name to modules/studio/ui/component , delete the searchInput.tsx and home-navbar/main-section.tsx and home-navbar/personal-section.tsx

#### modules/studio/component/layouts/studio-layout.tsx

```tsx

import { SidebarProvider } from '@/components/ui/sidebar';
import React from 'react'
import { StudioNavbar } from '../components/studio-navbar';
import { StudioSidebar } from '../components/studio-sidebar';

interface StudioLayoutProps{
  children:React.ReactNode;
}
export const StudioLayout = ({children}:StudioLayoutProps) => {
  return (
    <SidebarProvider>
      <div className="w-full">
       <StudioNavbar/>
       <div className="flex  min-h-screen pt-[4rem]">
        <StudioSidebar/>
        <main className="flex-1 overflow-y-auto">
        {children}
        </main>
       </div>
      </div>
    </SidebarProvider>
  )
}
```

#### modules/studio/component/studio-navbar/index.tsx

//add  border and shadow delete other component except { menu and logo } and { Auth bar }

```tsx
import { SidebarTrigger } from '@/components/ui/sidebar'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import { AuthButton } from '@/modules/auth/ui/components/auth-button'


export const StudioNavbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 h-16  bg-background flex items-center px-2 pr-5 z-50 border-b shadow-md">
      <div className="flex items-center gap-4 w-full">
        {/* menu and logo */}
        <div className="flex items-center flex-shrink-0">
        <SidebarTrigger/>
        <Link href="/">
          <div className="p-4 flex items-center gap-1">
          <Image src="/logo.svg" width={32} height={32} alt="logo"/>
          <p className="text-lg font-semibold tracking-tight">Studio</p>
          </div>
        </Link>
        </div>

        <div className="flex-1"/>
        {/* Auth bar */}
        <div className="flex-shrink-0 flex items-center gap-4">
          <AuthButton/>
        </div>
      </div>
    </nav>
    
  )
}

```

#### modules/studio/component/studio-sidebar/index.tsx

```tsx
"use client"
import { Sidebar, SidebarContent, SidebarGroup, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar'
import { Separator } from '@radix-ui/react-separator'
import { LogOutIcon,  VideoIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'

export const StudioSidebar = () => {
  const pathname=usePathname();
  return (
    <Sidebar className="pt-16 z-40 border-none" collapsible='icon'>
      <SidebarContent className='bg-background'>
        <SidebarGroup>
          <SidebarMenu>
            <StudioSidebarHeader/>
            <SidebarMenuItem>
              <SidebarMenuButton isActive={pathname==="/studio"} tooltip="Content" asChild >
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
```

#### create src/app/(studio)/layout.tsx

```tsx
interface LayoutProps{
  children:React.ReactNode;
}

import { StudioLayout } from '@/modules/studio/ui/layouts/studio-layout';
import React from 'react'

const Layout = ({children}:LayoutProps) => {
  return (
   <StudioLayout>
    {children}
   </StudioLayout>
  )
}

export default Layout
```

#### create src/app/(studio)/studio/page.tsx

```tsx
import React from 'react'

const Page = () => {
  return (
    <div>Page</div>
  )
}

export default Page
```

## Add sidebar user profile

### src/modules/studio/ui/components/studio-sidebar/StudioSidebarHeader.tsx

```tsx

import {  SidebarHeader, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { UserAvatar } from '@/components/user-avatar';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import React from 'react'

const StudioSidebarHeader = () => {
  const {user}=useUser();
  const {state}=useSidebar();
  if(!user){
    return(
      <SidebarHeader className="flex items-center justify-center pb-4">
        <Skeleton className="size-[112px] rounded-full"/>
        <div className="flex flex-col items-center mt-2 gap-y-1">
          <Skeleton className="h-4 w-[80px]"/>
          <Skeleton className="h-4 w-[100px]"/>
        </div>
      </SidebarHeader> 
    )
  }
  if(state==="collapsed"){
    return(
      <SidebarMenuItem>
        <SidebarMenuButton tooltip="Your Profile" asChild>
          <Link href="/users/current">
            <UserAvatar
              imageUrl={user.imageUrl}
              name={user.fullName?? "User"}
              size="xs"
            />
            <span>Your Profile</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  }
    return(
      <SidebarHeader className="flex items-center justify-center pb-4">
        <Link href="/users/current">
        <UserAvatar
              imageUrl={user.imageUrl}
              name={user.fullName?? "User"}
              className="size-[112px] hover:opacity-80 transition-opacity"
            />
        </Link>
          <div className="flex flex-col items-center mt-2 gap-y-1">
            <p className="text-sm font-medium">
                  Your profile
            </p>
            <p className="text-xs text-muted-foreground">
                {user.fullName}
            </p>
          </div>
      </SidebarHeader>
    )
 
}

export default StudioSidebarHeader;
```

### src/components/user-avatar.tsx

```tsx
import { VariantProps, cva } from "class-variance-authority";

import { Avatar,AvatarImage } from "./ui/avatar";
import { cn } from "@/lib/utils";
const avatarVariants=cva("",{
  variants:{
    size:{
      default:"h-9 w-9",
      xs:"h-4 w-4",
      sm:"h-6 w-6",
      lg:"h-10 w-10",
      xl:"h-[160px] w-[160px]"
    }
  },
  defaultVariants:{
    size:"default",
  },
})

interface UserAvatarProps extends VariantProps<typeof avatarVariants>{
    imageUrl:string;
    name:string;
    className?:string;
    onClick?:()=>void;
}
export const UserAvatar=({
  imageUrl,
  name,
  size,
  className,
  onClick,
}:UserAvatarProps)=>{
  return (
    <Avatar className={cn(avatarVariants({size,className}))} onClick={onClick}>
      <AvatarImage src={imageUrl} alt={name}/>
    </Avatar>
  )
}
```

# Chapter 10 Studio Video

## Requirements

When I click the add button ,it will direct me to the upload page,and the video can be saved in database, and after I upload the video,it will display in the studio page immediately.

## Workflow

![image-20250713181715277](/Users/a1/Library/Application Support/typora-user-images/image-20250713181715277.png)

## Create videos schema

https://orm.drizzle.team/docs/relations

### src/db/schema/videos.ts

```ts
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";
import { categories } from "./categories";
import { relations } from "drizzle-orm";

export const videos=pgTable("videos",{
  id:uuid().primaryKey().defaultRandom(),
  title:text().notNull(),
  description:text(),
  imageUrl:text("image_url").notNull(),
  createdAt:timestamp('created_at').defaultNow().notNull(),
  updatedAt:timestamp('updated_at').defaultNow().notNull(),
  userId:uuid('user_id').references(()=>users.id,{
    onDelete:"cascade"
  }),
  categoryId:uuid('category_id').references(()=>categories.id,{
    onDelete:"set null"
  }),
})

export const videoRelations=relations(videos,({one})=>({
  user:one(users,{
    fields:[videos.userId],
    references:[users.id],
  }),
  category:one(categories,{
    fields:[videos.categoryId],
    references:[categories.id],
  })
}))
```

### src/db/schema/users.ts

```ts
export const usersRelations=relations(users,({many})=>({
  videos:many(videos),
}))
```

### src/db/schema/categories.ts

```ts
import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { videos, } from "./videos";

export const categories=pgTable("categories",{
  id:uuid('id').primaryKey().defaultRandom(),
  name:text('name').notNull().unique(),
  description:text('description'),
  createdAt:timestamp('created_at').defaultNow().notNull(),
  updatedAt:timestamp('updated_at').defaultNow().notNull(),
},(t)=>[uniqueIndex('name_idx').on(t.name)])

export const categoriesRelations=relations(categories,({many})=>({
  videos:many(videos),
}))
```

bunx drizzle-kit push

bunx drizzle-kit studio

## Create src/modules/videos/server/procedures.ts

Create videos

```ts
import { db } from "@/db";
import { videos } from "@/db/schema/videos";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";

export const videosRouter=createTRPCRouter({
  create:protectedProcedure.mutation(async({ctx})=>{
    const {id:userId}=ctx.user;
    const [video]=await db  
          .insert(videos)
          .values({
            userId,
            title:"Untitled"
          }).returning()
          return{
            video:video,
          } 
          })
})
```

## Create src/modules/studio/server/procedures.ts

Get the videos & pagination 

```ts
import { db } from "@/db";
import { videos } from "@/db/schema/videos";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { and, desc, eq, lt, or } from "drizzle-orm";
import {z} from 'zod';
export const studioRouter=createTRPCRouter({
  getMany:protectedProcedure
    .input(
      z.object({
        cursor:z.object({
          id:z.string().uuid(),
          updatedAt:z.date(),
        }).nullish(),
        limit:z.number().min(1).max(100),
      })
    )
    .query(async({ctx,input})=>{
      const {cursor,limit}=input;
      const {id:userId}=ctx.user;
      const data=await db
        .select()
        .from(videos)
        .where(and(eq(videos.userId,userId),
          cursor
          ? or(
            lt(videos.id,cursor.id),
            and(eq(videos.id,cursor.id),
              lt(videos.updatedAt,cursor.updatedAt)
            )):undefined
        )).orderBy(desc(videos.updatedAt),desc(videos.id))
        .limit(limit+1)
        //Determine whether there is a next page.
      const hasMore=data.length>limit;
      const items=hasMore ? data.slice(0,-1):data;
      const lastItem=items[items.length-1];
      const nextCursor=hasMore ? 
      {
        id:lastItem.id,
        updatedAt:lastItem.updatedAt,
      }:null;
      return {
        items,
        nextCursor,
      }  
    })
})
```

## _app.ts

```ts
import { videosRouter } from '@/modules/videos/server/procedures';
import { createTRPCRouter} from '../init';

import { categoryRouter } from '@/modules/categories/server/procedure';
import { studioRouter } from '@/modules/studio/server/procedures';
export const appRouter = createTRPCRouter({
 categories:categoryRouter,
 videos:videosRouter,
 studio:studioRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;
```

## Create Add video button

### create modules/studio/ui/components/studio-upload-modal.tsx

```tsx
'use client';
import { Button } from '@/components/ui/button';
import { trpc } from '@/trpc/client';
import { Loader2Icon, PlusIcon } from 'lucide-react';
import React from 'react'
import { toast } from 'sonner';

const StudioUploadModal = () => {
  const utils=trpc.useUtils();
  const create=trpc.videos.create.useMutation({
    onSuccess:()=>{
      toast.success("video created !")
      utils.studio.getMany.invalidate();
    },
    onError:(error)=>{
      toast.error(error.message)
    }
  })    
  return (
    <Button variant="secondary" onClick={()=>create.mutate()} disabled={create.isPending}>
      {create.isPending ? <Loader2Icon className="animate-spin"/> :<PlusIcon/>}
      Create
    </Button>
  )
}

export default StudioUploadModal
```

### src/app/(studio)/layout.tsx

```tsx
import { Toaster } from '@/components/ui/sonner';
import { StudioLayout } from '@/modules/studio/ui/layouts/studio-layout';
import React from 'react';

interface LayoutProps{
  children:React.ReactNode;
}
const Layout = ({children}:LayoutProps) => {
  return (
   <StudioLayout>
    <Toaster/>
    {children}
   </StudioLayout>
  )
}

export default Layout
```

### mytubee/src/modules/studio/ui/component/studio-navbar/index.tsx

```tsx
 <div className="flex-1"/>
        {/* Auth bar */}
        <div className="flex-shrink-0 flex items-center gap-4">
          <StudioUploadModal/>
          <AuthButton/>
        </div>
      </div>
```

# Chapter 11 Infinite videos loading

## Requirements

when I click the +create button ,the studio main section will automatically display all the videos ,and can be infinite scroll automatically or manually

so we need a isManual attribute to decide if we need a button to manually load more data, and we also need to consider the state of the button (hasNextPage,isFetchingNextPage) and finally fetchNextPage.

## Workflow

![image-20250716132230082](/Users/a1/Library/Application Support/typora-user-images/image-20250716132230082.png)

## Client side

### src/modules/studio/views/studio-view.tsx

```tsx
import React from 'react'
import { VideoSection } from '../sections/video-section'

export const StudioView = () => {
  return (
    <div className="flex flex-col gap-y-6 pt-2.5">
      <div className="px-4">
        <h1 className='text-2xl font-bold'>Channel content</h1>
        {/* text-muted-foreground：让文字颜色变成「较弱的前景色」，一般用于提示语、说明文字、非重点信息。效果类似于灰色，但具体颜色由你项目主题中配置的 CSS 变量控制 */}
        <p className="text-xs text-muted-foreground">
          Manage your channel content and videos
        </p>
      </div>
      <VideoSection/>
    </div>
  )
}
```

### src/modules/studio/sections/video-section.tsx

```tsx
"use client"
import { DEFAULT_LIMIT } from "@/constants"
import { trpc } from "@/trpc/client"
import { Suspense } from "react"
import { ErrorBoundary } from "react-error-boundary"

export const VideoSection=()=>{
  return (
  <Suspense fallback={<p>loading...</p>}>
      <ErrorBoundary fallback={<p>error</p>}>
        <VideoSectionSuspense/>
      </ErrorBoundary>
    </Suspense>
  )
  
}

const VideoSectionSuspense=()=>{
  const [data]=trpc.studio.getMany.useSuspenseInfiniteQuery({
    limit:DEFAULT_LIMIT,
  },
  {
    getNextPageParam:(lastPage)=>lastPage.nextCursor,
  })
  return(
    <div>{JSON.stringify(data)}</div>
  )
}
```

## Server side

### src/app/(studio)/studio/page.tsx

```tsx
import { DEFAULT_LIMIT } from '@/constants'
import {StudioView}from '@/modules/studio/views/studio-view'
import { HydrateClient, trpc } from '@/trpc/server'
import React from 'react'

const Page = () => {
 void trpc.studio.getMany.prefetchInfinite({
  limit:DEFAULT_LIMIT
 })
  return (
    <HydrateClient>
      <StudioView/>
    </HydrateClient>
  )
}

export default Page
```

## Reusable Infinite Scroll component

### src/app/hooks/use-intersection-observer.ts

listen if an element  enters viewport ?

```ts
import { useEffect, useRef, useState } from "react";

export const UseIntersectionObserver=(options?:IntersectionObserverInit)=>{

  const [isIntersecting,setIsIntersecting]=useState(false);
  const targetRef=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const observer=new IntersectionObserver(([entry])=>{
      setIsIntersecting(entry.isIntersecting)
    },options)
    if(targetRef.current){
      observer.observe(targetRef.current)
    }
    return ()=>observer.disconnect();
  },[options])
    return{isIntersecting,targetRef}
}
```

### Create  src/components/infinite-scroll.tsx

```tsx
import { UseIntersectionObserver } from "@/hooks/use-intersection-observer";
import { useEffect } from "react";
import { Button } from "./ui/button";


interface InfiniteScrollProps{
  isManual?:boolean;
  hasNextPage:boolean;
  isFetchingNextPage:boolean;
  fetchNextPage:()=>void;
}

export const InfiniteScroll=({
  isManual=false,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}:InfiniteScrollProps)=>{
  const{isIntersecting,targetRef}=UseIntersectionObserver({
    threshold:0.5,
    rootMargin:"100px",
  })  
  useEffect(()=>{
    if(isIntersecting && hasNextPage && !isFetchingNextPage && !isManual){
      fetchNextPage();
    }
  },[isManual && hasNextPage && isFetchingNextPage && isIntersecting && fetchNextPage])
  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div ref={targetRef} className="h-1">
        {hasNextPage ?(
          <Button
          variant="secondary"
          disabled={!hasNextPage || isFetchingNextPage}
          onClick={()=>fetchNextPage()}
          >
            {isFetchingNextPage ? "Loading..." : "Load More"}
          </Button>
        ):
          (<p> You have reached the end of the list </p>)}
      </div>
    </div>
  )
}
```

### src/modules/studio/sections/video-section.tsx

```tsx
const VideoSectionSuspense=()=>{
  const [data,query]=trpc.studio.getMany.useSuspenseInfiniteQuery({
    limit:DEFAULT_LIMIT,
  },
  {
    getNextPageParam:(lastPage)=>lastPage.nextCursor,
  })
  return(
    <div>
      {JSON.stringify(data)}
      <InfiniteScroll
        isManual
        hasNextPage={query.hasNextPage}
        isFetchingNextPage={query.isFetchingNextPage}
        fetchNextPage={query.fetchNextPage}
      />
    </div>
  )
}
```

# Chapter 12 Mux Integration

## Requirements

when we click the create button,it will alert a  responsive dialog to upload video
we also need to create a free Mux account and integrate it with our project

connecting mux and database

## Workflow

### 流程详解：

1. **用户触发流程**：
   - 用户点击"创建"按钮
   - 调用 `create.mutate()` 函数
2. **后端处理**：
   - tRPC 调用 `videos.create` mutation
   - 使用 Mux SDK 创建上传任务
   - 在数据库插入视频记录
   - 返回视频数据和上传URL
3. **Mux服务**：
   - 生成直传URL（Google Cloud Storage）
   - 等待文件上传
4. **前端上传**：
   - 打开上传对话框
   - 渲染 `StudioUploader` 组件
   - 使用返回的上传URL进行文件上传
5. **Webhook处理**：
   - Mux 在事件发生时触发Webhook
   - 后端验证签名确保安全
   - 根据事件类型更新视频状态
   - 更新数据库中的视频记录
6. **状态同步**：
   - 前端刷新视频列表数据
   - 显示最新的视频状态

## create a responsive dialog

### src/components/responsive-dialog.tsx

```tsx
import { useIsMobile } from "@/hooks/use-mobile";
import {Dialog,DialogContent,DialogHeader,DialogTitle} from "@/components/ui/dialog";
import {Drawer,DrawerContent,DrawerHeader,DrawerTitle} from "@/components/ui/drawer";


interface ResponsiveDialogProps{
  children:React.ReactNode;
  title:string;
  open:boolean;
  onOpenChange:(open:boolean)=>void
}

export const ResponsiveDialog=({
  children,
  title,
  open,
  onOpenChange,
}:ResponsiveDialogProps)=>{
  const isMobile=useIsMobile();
  if(isMobile){
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>
              {title}
            </DrawerTitle>
          </DrawerHeader>
          {children}
        </DrawerContent>
      </Drawer>
    )
  }
  return(
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {title}
          </DialogTitle>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  )
}
```

### src/hooks/use-mobile.tsx

```tsx
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}
```

## Create a free Mux account

### Add Environment

https://dashboard.mux.com/organizations/6e8ife/environments

![image-20250716182935395](/Users/a1/Library/Application Support/typora-user-images/image-20250716182935395.png)

### Click "Integrate with your app"

![image-20250717141518649](/Users/a1/Library/Application Support/typora-user-images/image-20250717141518649.png)

![image-20250717141659983](/Users/a1/Library/Application Support/typora-user-images/image-20250717141659983.png)

### Click Generate token

![image-20250719145848077](/Users/a1/Library/Application Support/typora-user-images/image-20250719145848077.png)

#### .env.local

```
MUX_TOKEN_ID=117e8b6c-9662-4b4f-ac49-7020744e6511
MUX_TOKEN_SECRECT=YXQzD5sMr9WF/+1lQ1UZbxwXUTH0pECo6Jz4aWAZU89G+0ybO0tTywXJUo7t4KnUhWkN8hv19az
```

### click Docs and Support-->Documentation-->Web frameworks -->next.js

bun add @mux/mux-uploader-react@1.1.1

#### allowing users to upload video to your app

##### create modules/studio/ui/components/studio-uploader.tsx

```tsx

import MuxUploader,{
  MuxUploaderDrop,
  MuxUploaderFileSelect,
  MuxUploaderProgress,
  MuxUploaderStatus,
} from  "@mux/mux-uploader-react";

interface StudioUploaderProps{
  endpoint:string | null
  onSuccess:()=>void
}

// 需通过 endpoint 属性指定 Mux 上传的 API 地址（通常由后端生成安全的上传凭证）。
export const StudioUploader=({
  endpoint,
  onSuccess
}:StudioUploaderProps)=>{
  return (
    <div>
      <MuxUploader endpoint={endpoint}/>
    </div>
  )
}
```

#### we need to add the endpoint here ,so we need bun add @mux/mux-node@9.0.1

> Why this SDK is needed:
>
> 1. To generate secure upload URLs (for direct frontend uploads to Mux)
> 2. To manage video assets (transcoding, thumbnails, subtitles, etc.)
> 3. To retrieve playback data(播放数据) and analytics reports
> 4. To enable secure server-to-server communication

##### create src/lib/mux.ts

```ts
import Mux from "@mux/mux-node";
export const mux=new Mux({
  tokenId:process.env.MUX_TOKEN_ID,
  tokenSecret:process.env.MUX_TOKEN_SECRET,
})
```

#### create a upload

##### modules/videos/server/procedures.ts

```ts
import { db } from "@/db";
import { videos } from "@/db/schema/videos";
import { mux } from "@/lib/mux";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";

export const videosRouter=createTRPCRouter({
  create:protectedProcedure.mutation(async({ctx})=>{
    const {id:userId}=ctx.user;
    const upload= await mux.video.uploads.create({
      new_asset_settings:{
        passthrough:userId,
        playback_policy:["public"],
      },
        cors_origin:"*",
    })
    const [video]=await db  
          .insert(videos)
          .values({
            userId,
            title:"Untitled"
          }).returning()
          return{
            video:video,
            url:upload.url,
          } 
          })
})
```

### Connecting Mux and database

#### src/db/schema/video.ts

```ts
export const videos=pgTable("videos",{
  id:uuid().primaryKey().defaultRandom(),
  title:text().notNull(),
  description:text(),
  //记录视频在 Mux 上的当前状态（如 `"preparing"`、`"ready"`、`"errored"` 等）。
  muxStatus:text("mux_status"),
  //存储 Mux 视频资源（asset）的唯一标识符（`asset.id`）。
  muxAssetId:text("mux_asset_id").unique(),
  //存储上传任务的唯一标识符（`upload.id`）
  muxUploadId:text("mux_upload_id").unique(),
  //存储可用于播放视频的 ID，配合 Mux 的播放器使用。
  muxPlaybackId:text("mux_playback_id").unique(),
  //存储 Mux 自动生成的 **字幕 Track 的 ID**（比如自动生成的 English 字幕）。
  muxTrackId:text("mux_track_id").unique(),
  //存储 Mux 自动生成的 **字幕 Track 的 ID**（比如自动生成的 English 字幕）。
  muxTrackStatus:text("mux_track_status"),
  createdAt:timestamp('created_at').defaultNow().notNull(),
  updatedAt:timestamp('updated_at').defaultNow().notNull(),
  userId:uuid('user_id').references(()=>users.id,{
    onDelete:"cascade"
  }),
  categoryId:uuid('category_id').references(()=>categories.id,{
    onDelete:"set null"
  }),
})
```

#### modules/videos/server/procedures.ts

```ts
import { db } from "@/db";
import { videos } from "@/db/schema/videos";
import { mux } from "@/lib/mux";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";

export const videosRouter=createTRPCRouter({
  create:protectedProcedure.mutation(async({ctx})=>{
    const {id:userId}=ctx.user;
    const upload= await mux.video.uploads.create({
      new_asset_settings:{
        passthrough:userId,
        playback_policy:["public"],
      },
        cors_origin:"*",
    })
    const [video]=await db  
          .insert(videos)
          .values({
            userId,
            title:"Untitled",
            muxStatus:"waiting",
            //之后 webhook 触发时会用这个 ID 来识别视频。
            muxUploadId:upload.id,
          }).returning()
          return{
            video:video,
            url:upload.url,
          } 
          })
})
```

bunx  drizzle-kit push

### update upload video zone

#### src/modules/studio/ui/component/studio-upload-modal.tsx

```tsx
'use client';
import { Button } from '@/components/ui/button';
import { trpc } from '@/trpc/client';
import { Loader2Icon, PlusIcon } from 'lucide-react';
import React from 'react'
import { toast } from 'sonner';
import {ResponsiveDialog} from "../../../../components/responsive-dialog";
import { StudioUploader } from './studio-uploader';



const StudioUploadModal = () => {
  const utils=trpc.useUtils();
  const create=trpc.videos.create.useMutation({
    onSuccess:()=>{
      toast.success("video created !")
      utils.studio.getMany.invalidate();
    },
    onError:(error)=>{
      toast.error(error.message)
    }
  })    
  return (
    <>
    <ResponsiveDialog
      title="Upload a video"
      open={!!create.data?.url}
      onOpenChange={()=>create.reset()}
    >
      {create.data?.url ? <StudioUploader endpoint={create.data.url} onSuccess={()=>{}}/> : <Loader2Icon/> }
    </ResponsiveDialog>
     <Button variant="secondary" onClick={()=>create.mutate()} disabled={create.isPending}>
      {create.isPending ? <Loader2Icon className="animate-spin"/> :<PlusIcon/>}
      Create
    </Button>
    </>
   
  )
}

export default StudioUploadModal
```

> ### `create` 对象的核心结构
>
> typescript
>
> ```
> const create = {
>   mutate: (input: VideoCreateInput) => void,      // 触发创建操作的函数
>   mutateAsync: (input: VideoCreateInput) => Promise<Video>, // 异步创建函数
>   status: 'idle' | 'loading' | 'success' | 'error', // 当前状态
>   data: Video | undefined,                      // 成功时返回的视频数据
>   error: Error | null,                          // 错误信息
>   isIdle: boolean,                              // 是否空闲状态
>   isLoading: boolean,                           // 是否正在加载
>   isSuccess: boolean,                           // 是否成功
>   isError: boolean,                             // 是否出错
>   reset: () => void,                            // 重置状态
>   // 生命周期回调
>   onSuccess: (data: Video, variables: VideoCreateInput) => void,
>   onError: (error: Error, variables: VideoCreateInput) => void,
>   onSettled: (data: Video | undefined, error: Error | null) => void
> }
> ```

## Webhook

https://dashboard.mux.com/organizations/c571s0/settings/webhooks?environment_id=fu9u8p

### Settings-webhook

![image-20250717171809638](/Users/a1/Library/Application Support/typora-user-images/image-20250717171809638.png)

### Choose my-tubee-development and click create new webhook

![image-20250717172124345](/Users/a1/Library/Application Support/typora-user-images/image-20250717172124345.png)

//package.json

![image-20250717172209375](/Users/a1/Library/Application Support/typora-user-images/image-20250717172209375.png)

![image-20250717172313301](/Users/a1/Library/Application Support/typora-user-images/image-20250717172313301.png)

#### .env.local

```
MUX_WEBHOOK_SECRECT=rce1pjnbgt77ichgkv5s7q4619qoia36
```

### create src/app/api/videos/webhook/route.ts

```ts
import{eq} from "drizzle-orm";
import {headers} from "next/headers";
import {
  VideoAssetCreatedWebhookEvent,
  VideoAssetErroredWebhookEvent,
  VideoAssetReadyWebhookEvent,
  VideoAssetTrackReadyWebhookEvent,
}from"@mux/mux-node/resources/webhooks";
import { mux } from "@/lib/mux";
import { db } from "@/db";
import { videos } from "@/db/schema/videos";


const SIGNING_SECRET=process.env.MUX_WEBHOOK_SECRET!;

type WebhookEvent=
  |VideoAssetCreatedWebhookEvent
  |VideoAssetErroredWebhookEvent
  |VideoAssetReadyWebhookEvent
  |VideoAssetTrackReadyWebhookEvent

  export const POST=async(request:Request)=>{
    if(!SIGNING_SECRET){
      throw new Error("SIGNING_SECRET is not set")
    }
    const headerPayload=await headers();
    const muxSignature=headerPayload.get("mux-signature")
    if(!muxSignature){
      return new Response("No signature found",{status:401})
    }
    const payload = await request.json();
    const body =JSON.stringify(payload);
    //verify the SIGNING_SECRET
    //verify the mux-signature
    //verify the body
    mux.webhooks.verifySignature(
      body,
      {
        "mux-signature":muxSignature,
      },
      SIGNING_SECRET,
    );
    //webhook event--create
    switch(payload.type as WebhookEvent["type"]){
      case "video.asset.created":{
        const data=payload.data as VideoAssetCreatedWebhookEvent["data"]
        if(!data.upload_id){
          return new Response('No upload ID found')
        }
        await db
            .update(videos)
            .set({
              muxAssetId:data.id,
              muxStatus:data.status
            })
            .where(eq(videos.muxUploadId,data.upload_id));
            break;
      }
    }
    return new Response("Webhook received",{status:200})
  }
```

> src/modules/videos/server/procedure.ts里的upload的数据结构是怎样的? 
>
> ```ts
> const upload= await mux.video.uploads.create({
>       new_asset_settings:{
>         passthrough:userId,
>         playback_policy:["public"],
>       },
>         cors_origin:"*",
>     })
> 		const [video]=await db  
>           .insert(videos)
>           .values({
>             userId,
>             title:"Untitled",
>             muxStatus:"waiting",
>             //之后 webhook 触发时会用这个 ID 来识别视频。
>             muxUploadId:upload.id,
>           }).returning()
>           return{
>             video:video,
>             url:upload.url,
>           } 
>           })
> ```
>
> ```
> {
>   "data": {
>     "id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", // 上传任务的唯一ID
>     "timeout": 3600, // 上传有效时间（秒）
>     "status": "waiting", // 状态: waiting, asset_created, cancelled, errored
>     "new_asset_settings": { // 创建新资源的配置
>       "passthrough": "your-user-id", // 自定义标识（原样传递）
>       "playback_policy": ["public"] // 播放权限策略
>     },
>     "asset_id": "xxxxxxxxxxxxxxxxxxxx", // 关联的视频资源ID（上传完成后生成）
>     "cors_origin": "*", // 允许跨域上传的来源
>     "url": "https://storage.googleapis.com/...", // 用于上传文件的直传URL
>     "test": false, // 是否为测试模式
>     "created_at": "2025-07-17T12:34:56Z", // 创建时间戳
>     "error": { // 错误信息（如果上传失败）
>       "type": "invalid_upload",
>       "message": "Upload expired"
>     }
>   }
> }
> ```
>
> 1. 但是!!**SDK 返回结构扁平化**：
>    - Mux SDK 已经自动提取了 API 响应中的 `data` 对象
>    - 返回的 `upload` 变量 **本身就是原始响应中的 `data` 对象**
> 2. 结构对比：
>
> ```js
> // API 原始响应（你看不到这层）
> {
>   data: {   // ← SDK 自动剥离这层
>     id: "xyz",
>     url: "...",
>     ...
>   }
> }
> 
> // 你实际得到的 upload 对象：
> {
>   id: "xyz",    // ← 直接访问这里
>   url: "...",
>   ...
> }
> ```
>
> const payload = await request.json();
>
> const data=payload.data as VideoAssetCreatedWebhookEvent["data"]
>
> if(!data.upload_id){
>           return new Response('No upload ID found')
>         }
>         await db
>             .update(videos)
>             .set({
>               muxAssetId:data.id,
>               muxStatus:data.status
>             })
>             .where(eq(videos.muxUploadId,data.upload_id));
>             break;
>       }
>     }
>
> 的数据结构是怎样的?
>
> ```
> {
>   //这是这个 Webhook 事件本身的唯一标识符
>   "id": "evt-abc123456789",
>   "type": "video.asset.created",
>   "object": "event",
>   "data": {
>     //表示已经在 Mux 平台上成功创建的 视频资源（Asset） 的唯一 ID
>     //所有和播放相关的操作、状态变化，都会围绕这个 asset-id。
>     //你以后获取视频状态、播放链接、封面图等，都是通过它。
>     "id": "asset-xyz987654321",
>     "status": "preparing",
>     //当你在前端通过 <MuxUploader endpoint=... /> 上传视频时，是上传到一个叫 Upload 的临时上传任务。
>     //上传完成后，Mux 会基于这个上传任务 upload_id 自动创建一个视频 asset。
>     //所以它是 asset 的“来源”，你可以通过 upload_id 找出用户上传时的上下文信息（比如哪个用户上传的，上传时记录了哪些 metadata）。
>     "upload_id": "upload-abc123456",
>     "created_at": "2024-04-10T09:00:00Z",
>     "duration": null,
>     "max_stored_resolution": null,
>     "playback_ids": [],
>     ...
>   }
> }
> ```

## Do some basic ui

### src/modules/studio/ui/component/studio-uploader.tsx

```tsx
import { Button } from "@/components/ui/button";
import MuxUploader,{
  MuxUploaderDrop,
  MuxUploaderFileSelect,
  MuxUploaderProgress,
  MuxUploaderStatus,
} from "@mux/mux-uploader-react";
import { UploadIcon } from "lucide-react";

interface StudioUploaderProps{
  endpoint?:string|null;
  onSuccess:()=>void;
}
const UPLOADER_ID="video-uploader";
export const StudioUploader=({
  endpoint,
  onSuccess,
}:StudioUploaderProps)=>{
   return(
    <div>
      <MuxUploader 
      onSuccess={onSuccess}
      endpoint={endpoint}
      //连接组件：UPLOADER_ID 作为唯一标识符，用于将 <MuxUploader> 主组件与其他子组件（如 <MuxUploaderDrop>）关联起来
      id={UPLOADER_ID}
     //hidden 类隐藏了 <MuxUploader> 本身，因为它只需要提供功能逻辑，不需要显示UI
     //保留功能：虽然视觉上隐藏了，但它的上传功能仍然正常工作
     //Tailwind 的 group 修饰符：group/uploader 允许在父元素状态变化时修改子元素样式（例如 hover 时改变子元素样式）
      className="hidden group/uploader"
      />
      <MuxUploaderDrop muxUploader={UPLOADER_ID} className="group/drop">
        {/* 想象一下你有一个带插槽的玩具（比如乐高积木）：
            组件是玩具框架：就像乐高底板，它有预设的插槽位置
            slot 是插槽：这些是你可以插入自定义积木的地方
            你的内容是积木：你放入插槽的 HTML 内容就是自定义积木
            "heading" 和 "separator" 是什么？
            这些是组件预定义的插槽名称，就像玩具上标有"H"（heading）和"S"（separator）的插槽：
            slot="heading"
            位置：拖放区域的顶部标题区
            默认内容：组件自带的标准标题
            你的覆盖：用 <div slot="heading"> 完全替换为你的自定义标题*/}
        <div slot="heading" className="flex flex-col items-center gap-6">
          <div className="flex items-center justify-center gap-2 rounded-full bg-muted h-32 w-32">
            <UploadIcon className="size-10 text-muted-foreground group/drop-[&[active]]:animate-bounce transition-all duration-300"/>
          </div>
          <div className="flex flex-col gap-2 text-center">
            <p className="text-sm">Drag and drop video files to upload</p>
            <p className="text-sm  text-muted-foreground">Your videos will be private until you publish them</p>
          </div>
          <MuxUploaderFileSelect muxUploader={UPLOADER_ID}>
            <Button type="button" className="rounded-full">
              Select Files
              </Button>  
          </MuxUploaderFileSelect>
        </div>
        <span slot="separator" className="hidden"/>
        <MuxUploaderStatus
          muxUploader={UPLOADER_ID}
          className="text-sm"
        />
        <MuxUploaderProgress 
          muxUploader={UPLOADER_ID}
          className="text-sm"
          type="percentage"
        />
        <MuxUploaderProgress
          muxUploader={UPLOADER_ID}
          type="bar"
        />
      </MuxUploaderDrop>
    </div>
   ) 
}
```

# Chapter 13 Mux webhooks

## Requirements

we need to add the static thumbnail and hover animate effect 
We also need to display the video title/desription/duration/status/creation date/visibility

all of this need to integrated with our mux webhook

## Workflow

![image-20250719170131098](/Users/a1/Library/Application Support/typora-user-images/image-20250719170131098.png)

![image-20250719170158554](/Users/a1/Library/Application Support/typora-user-images/image-20250719170158554.png)

## Add thumbnail

### create modules/videos/ui/components/video-thumbnail.tsx

```tsx
import Image from "next/image"

interface VideoThumbnailProps{
  imageUrl?:string|null;
}
export const VideoThumbnail=({imageUrl}:VideoThumbnailProps)=>{
  return (
    <div className="relative">
      <div className="relative w-full overflow-hidden rounded-xl aspect-video">
        <Image src={ imageUrl ?? "/placeholder.svg" }alt="Thumbnail" fill className="h-full w-full object-cover"/>
      </div>
      {/* Video duration box */}
      {/* TODO:Add video duration box */}
    </div>
  );
};
```

### modules/studio/ui/sections/video-section.tsx

```tsx
<TableBody>
            {videos.pages.flatMap((page)=>page.items).map((video)=>(
              <Link href={`/studio/videos/${video.id}`} key={video.id} legacyBehavior>
                <TableRow className="cursor-pointer">
                  <TableCell>
                   <div className="flex items-center gap-4">
                    {/* aspect-video 父容器宽度确定时，高度会自动保持 16:9 比例。
                        shrink-0	阻止在 flex 布局中被压缩
                    */}
                    <div className="relative aspect-video w-36 shrink-0">
                      <VideoThumbnail imageUrl={video.thumbnailUrl}/>
                    </div>
                   </div>
                  
```

### update video schema

src/db/schema.ts

```ts
//videos schema
export const videos=pgTable("videos",{
  id: uuid("id").primaryKey().defaultRandom(),
  title:text("title").notNull(),
  description:text("description"),
  muxStatus:text("mux_status"),
  muxAssetId:text("mux_asset_id").unique(),
  muxUploadId:text("mux_upload_id").unique(),
  muxPlaybackId:text("mux_playback_id").unique(),
  muxTrackId:text("mux_track_id").unique(),
  muxTrackStatus:text("mux_track_status"),
  thumbnailUrl:text("thumbnail_url"),
```

bunx drizzle-kit push

### src/app/api/videos/webhook/route.ts

```ts
case "video.asset.ready":{
        const data=payload.data as VideoAssetReadyWebhookEvent["data"];
        const playbackId=data.playback_ids?.[0].id[0];

        if(!playbackId){
          return new Response("Missing playbackId",{status:400})
        }
        if(!data.upload_id){
          return new Response("Missing upload ID",{status:400})
        }
        const thumbnailUrl=`https://image.mux.com/${playbackId}/thumbnail.jpg`;
        await db
            .update(videos)
            .set({
              muxStatus:data.status,
              muxPlaybackId:playbackId,
              muxAssetId:data.id,
              thumbnailUrl,
            })
            .where(eq(videos.muxUploadId,data.upload_id))
            break;
            }
             
```

#### next.config.ts

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images:{
    remotePatterns:[{
      protocol:"https",
      hostname:"image.mux.com",
    }]
  }
};

export default nextConfig;
```

## add animate thumbnail(when hover on it)

### Update video schema

#### src/db/schema.ts

```ts
//videos schema
export const videos=pgTable("videos",{
  id: uuid("id").primaryKey().defaultRandom(),
  title:text("title").notNull(),
  description:text("description"),
  muxStatus:text("mux_status"),
  muxAssetId:text("mux_asset_id").unique(),
  muxUploadId:text("mux_upload_id").unique(),
  muxPlaybackId:text("mux_playback_id").unique(),
  muxTrackId:text("mux_track_id").unique(),
  muxTrackStatus:text("mux_track_status"),
  thumbnailUrl:text("thumbnail_url"),
  previewUrl:text("preview_url"),
```

bunx drizzle-kit push

### src/app/api/videos/webhook/route.ts

```ts
const previewUrl=`https://image.mux.com/${playbackId}/animated.gif`;
        await db
            .update(videos)
            .set({
              muxStatus:data.status,
              muxPlaybackId:playbackId,
              muxAssetId:data.id,
              thumbnailUrl,
              previewUrl,
            })
            .where(eq(videos.muxUploadId,data.upload_id))
            break;
```

### modules/studio/ui/sections/video-section.tsx

```tsx
<TableBody>
            {videos.pages.flatMap((page)=>page.items).map((video)=>(
              <Link href={`/studio/videos/${video.id}`} key={video.id} legacyBehavior>
                <TableRow className="cursor-pointer">
                  <TableCell>
                   <div className="flex items-center gap-4">
                    {/* aspect-video 父容器宽度确定时，高度会自动保持 16:9 比例。
                        shrink-0	阻止在 flex 布局中被压缩
                    */}
                    <div className="relative aspect-video w-36 shrink-0">
                      <VideoThumbnail 
                      imageUrl={video.thumbnailUrl}
                      previewUrl={video.previewUrl}
                      title={video.title}
                      />
                    </div>
```

### create modules/videos/ui/components/video-thumbnail.tsx

```tsx
interface VideoThumbnailProps{
  imageUrl?:string|null;
  previewUrl?:string|null;
  title:string;
}
export const VideoThumbnail=({imageUrl,previewUrl,title}:VideoThumbnailProps)=>{
  return (
    <div className="relative group">
      {/* Thumbnail wrapper */}
      {/* aspect-video：是 Tailwind CSS 提供的一个 实用工具类（utility class），用于设置元素的宽高比，尤其适用于视频容器等需要保持固定比例的内容显示。将元素的宽高比设置为 16:9（视频常用比例） */}
      <div className="relative w-full overflow-hidden rounded-xl aspect-video">
        {/* fill 图片将填充整个父元素的空间，并且会自动绝对定位来适配这个容器。 */}
        <Image 
        src={ imageUrl ?? "/placeholder.svg" }
        alt={title} 
        fill 
        className="h-full w-full object-cover group-hover:opacity-0"
        />
         <Image 
        src={ previewUrl ?? "/placeholder.svg" }
        alt={title} 
        fill 
        className="h-full w-full object-cover opacity-0 group-hover:opacity-100"
        />
      </div>
```

## Add duration for video

### src/db/schema.ts

```ts
//videos schema
export const videos=pgTable("videos",{
  id: uuid("id").primaryKey().defaultRandom(),
  title:text("title").notNull(),
  description:text("description"),
  muxStatus:text("mux_status"),
  muxAssetId:text("mux_asset_id").unique(),
  muxUploadId:text("mux_upload_id").unique(),
  muxPlaybackId:text("mux_playback_id").unique(),
  muxTrackId:text("mux_track_id").unique(),
  muxTrackStatus:text("mux_track_status"),
  thumbnailUrl:text("thumbnail_url"),
  previewUrl:text("preview_url"),
  duration:integer("duration"),
```

bunx drizzle-kit push

### src/app/api/videos/webhook/route.ts

```ts
const thumbnailUrl=`https://image.mux.com/${playbackId}/thumbnail.jpg`;
        const previewUrl=`https://image.mux.com/${playbackId}/animated.gif`;
        const duration=data.duration?Math.round(data.duration*1000):0;
        await db
            .update(videos)
            .set({
              muxStatus:data.status,
              muxPlaybackId:playbackId,
              muxAssetId:data.id,
              thumbnailUrl,
              previewUrl,
              duration,
            })
            .where(eq(videos.muxUploadId,data.upload_id))
            break;
```

### modules/studio/ui/sections/video-section.tsx

```tsx
<div className="relative aspect-video w-36 shrink-0">
                      <VideoThumbnail 
                      imageUrl={video.thumbnailUrl}
                      previewUrl={video.previewUrl}
                      title={video.title}
                      duration={video.duration ||0}
                      />
```

### create modules/videos/ui/components/video-thumbnail.tsx

```tsx
return (
    <div className="relative group">
      {/* Thumbnail wrapper */}
      {/* aspect-video：是 Tailwind CSS 提供的一个 实用工具类（utility class），用于设置元素的宽高比，尤其适用于视频容器等需要保持固定比例的内容显示。将元素的宽高比设置为 16:9（视频常用比例） */}
      <div className="relative w-full overflow-hidden rounded-xl aspect-video">
        {/* fill 图片将填充整个父元素的空间，并且会自动绝对定位来适配这个容器。 */}
        <Image 
        src={ imageUrl ?? "/placeholder.svg" }
        alt={title}
        fill 
        className="h-full w-full object-cover group-hover:opacity-0"
        />
         <Image 
        src={ previewUrl ?? "/placeholder.svg" }
        alt={title}
        fill 
        className="h-full w-full object-cover opacity-0 group-hover:opacity-100"
        />
      </div>
      {/* Video duration box */}
      <div className="absolute bottom-2 right-2 px-1 py-0.5 rounded bg-black/80 text-white text-xs font-medium">
        {duration}   
      </div>
```

## Creating a format duration util

### src/lib/utils.ts

```tsx
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatDuration=(duration:number)=>{
  const seconds=Math.floor((duration%60000)/1000);
  const minutes=Math.floor(duration/60000);
  return`${minutes.toString().padStart(2,'0')}:${seconds.toString().padStart(2,'0')}`;
};

```

### create modules/videos/ui/components/video-thumbnail.tsx

```tsx
return (
    <div className="relative group">
      {/* Thumbnail wrapper */}
      {/* aspect-video：是 Tailwind CSS 提供的一个 实用工具类（utility class），用于设置元素的宽高比，尤其适用于视频容器等需要保持固定比例的内容显示。将元素的宽高比设置为 16:9（视频常用比例） */}
      <div className="relative w-full overflow-hidden rounded-xl aspect-video">
        {/* fill 图片将填充整个父元素的空间，并且会自动绝对定位来适配这个容器。 */}
        <Image 
        src={ imageUrl ?? "/placeholder.svg" }
        alt={title}
        fill 
        className="h-full w-full object-cover group-hover:opacity-0"
        />
         <Image 
        src={ previewUrl ?? "/placeholder.svg" }
        alt={title}
        fill 
        className="h-full w-full object-cover opacity-0 group-hover:opacity-100"
        />
      </div>
      {/* Video duration box */}
      <div className="absolute bottom-2 right-2 px-1 py-0.5 rounded bg-black/80 text-white text-xs font-medium">
        {formatDuration(duration)}  
      </div>
    </div>
```

## update the video title\description\status\date

### modules/studio/ui/sections/video-section.tsx

```tsx
							   <TableCell>
                   <div className="flex items-center gap-4">
                    {/* aspect-video 父容器宽度确定时，高度会自动保持 16:9 比例。
                        shrink-0	阻止在 flex 布局中被压缩
                    */}
                    <div className="relative aspect-video w-36 shrink-0">
                      <VideoThumbnail 
                      imageUrl={video.thumbnailUrl}
                      previewUrl={video.previewUrl}
                      title={video.title}
                      duration={video.duration ||0}
                      />
                    </div>
                    <div className="flex flex-col overflow-hidden gay-y-1">
                      <span className="text-sm line-clamp-1">{video.title}</span>
                      {/* line-clamp-1 的意思是：最多只显示 1 行文字，超出部分用省略号 (...) 结尾。 */}
                      <span className="text-xs text-muted-foreground line-clamp-1">{video.description || "no description"}</span>
                    </div>
                   </div>
                  </TableCell>
                  <TableCell>
                    visibility
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center ">
                      {snakeCaseToTitle(video.muxStatus || "Error")}
                    </div>
                  </TableCell>
                  {/* 是一个 用于文本溢出处理的工具类，可以让文本超出容器宽度时显示为省略号（...）*/}
                  <TableCell className="text-sm truncate">
                    {format(new Date(video.createdAt),"d MMM yyyy")}
                  </TableCell>
```

### src/lib/utils.ts

```ts
export const snakeCaseToTitle=(str:string)=>{
  //\b\w 匹配每个单词的第一个字母。.replace(..., char => char.toUpperCase()) 把这些字母转换为大写
  //\b 表示 “单词边界”\w 表示单个 单词字符，相当于 [a-zA-Z0-9_]。匹配出现在“单词边界”之后的第一个单词字符。
  return str.replace(/_/g," ").replace(/\b\w/g,(char)=>char.toUpperCase())
}
```

## update visibility

### src/db/schema.ts

```ts
//这是定义 PostgreSQL 数据库中的 ENUM 类型，用来约束字段只能是某几个固定值之一。
export const videoVisibility=pgEnum("video_visibility",[
  "private",
  "public",
])
//videos schema
export const videos=pgTable("videos",{
  id: uuid("id").primaryKey().defaultRandom(),
  title:text("title").notNull(),
  description:text("description"),
  muxStatus:text("mux_status"),
  muxAssetId:text("mux_asset_id").unique(),
  muxUploadId:text("mux_upload_id").unique(),
  muxPlaybackId:text("mux_playback_id").unique(),
  muxTrackId:text("mux_track_id").unique(),
  muxTrackStatus:text("mux_track_status"),
  thumbnailUrl:text("thumbnail_url"),
  previewUrl:text("preview_url"),
  duration:integer("duration").default(0).notNull(),
  visibility:videoVisibility("visibility").default("private").notNull(),
```

### modules/studio/ui/sections/video-section.tsx

```tsx
									<TableCell>
                    <div className="flex items-center">
                      {video.visibility==="private"?(
                        <LockIcon className="size-4 mr-2"/>
                      ):(
                        <Globe2Icon className="size-4 mr-2"/>
                      )}
                      {snakeCaseToTitle(video.visibility)}
                    </div>
                  </TableCell>
```

## Handle"video.asset.error" event

### src/app/api/videos/webhook/route.ts

```ts
case "video.asset.errored":{
        const data=payload.data as VideoAssetErroredWebhookEvent["data"];
        if(!data.upload_id){
          return new Response("Missing upload ID",{status:400})
        }
        await db
             .update(videos)
             .set({
              muxStatus:data.status,
             }) 
             .where(eq(videos.muxUploadId,data.upload_id));
             break;
      }
      case "video.asset.deleted":{
        const data=payload.data as VideoAssetDeletedWebhookEvent["data"];
        if(!data.upload_id){
          return new Response("Missing upload ID",{status:400})
        }
        await db
            .delete(videos)
            .where(eq(videos.muxUploadId,data.upload_id));
      }
    }
```

### src/create modules/videos/ui/components/video-thumbnail.tsx

优化一下

```tsx
<Image 
        /* !!previewUrl 的意思是：「如果 previewUrl 有值，就为 true，否则为 false」。
          2. unoptimized 是什么？
          在 Next.js 的 <Image /> 组件中，unoptimized 是一个布尔属性：
          默认为 false，表示 使用 Next.js 的图片优化功能（例如压缩、懒加载等）。
          如果你设置为 true，表示 跳过图片优化，直接加载原始图片地址。 */
         unoptimized={!!previewUrl}
        src={ previewUrl ?? "/placeholder.svg" }
        alt={title}
        fill 
        className="h-full w-full object-cover opacity-0 group-hover:opacity-100"
        />
      </div>
      {/* Video duration box */}
      <div className="absolute bottom-2 right-2 px-1 py-0.5 rounded bg-black/80 text-white text-xs font-medium">
        {formatDuration(duration)}  
      </div>
```

## handle "video.asset.track.ready" event

this will only fire if you have audio inside of your videos and also if you enabled subtitles in the first place

### src/app/api/videos/webhook/route.ts

```ts
case "video.asset.track.ready":{
        const data=payload.data as VideoAssetTrackReadyWebhookEvent["data"] &{
          asset_id:string;
        };

        console.log("Track ready");
        

        //TS incorrectly says that asset_id does not exist
        const assetId=data.asset_id;
        const trackId=data.id;
        const status=data.status;
        if(!assetId){
          return new Response("Missing asset ID",{status:400})
      }
      await db
          .update(videos)
          .set({
              muxTrackId:trackId,
              muxTrackStatus:status,
            })
            .where(eq(videos.muxAssetId,assetId));
           break;
    }
```

### modules/videos/server/procedures.ts

add subtitle

```ts
//create new videos
export const videosRouter=createTRPCRouter({ 
  create:protectedProcedure.mutation(async({ctx})=>{
    const{id:userId}= ctx.user
    const upload=await mux.video.uploads.create({
        new_asset_settings:{
          passthrough:userId,
          playback_policy:["public"],
          input:[
            {
              generated_subtitles:[
                {
                  language_code:'en',
                  name:"English",
                },
            ],
            },
          ],
        },
        cors_origin:"*",//In Production ,set to your url
    })
```

# Chapter 14 Video form

## Requirements

![image-20250720181030324](/Users/a1/Library/Application Support/typora-user-images/image-20250720181030324.png)

when I click the create button ,it will turn to the video form page, in this page ,we can change the video title, description ,thumbnail, category,and visibility

We can also copy the video link and see the video loading status(ready or waiting)

## Workflow

![image-20250721131009021](/Users/a1/Library/Application Support/typora-user-images/image-20250721131009021.png)

## Add skeleton to modules/studio/ui/sections/ video-section.tsx

```tsx
export const VideoSection=()=>{
  const router = useRouter();
  return (
    <Suspense fallback={<VideosSectionSkeleton/>}>
      <ErrorBoundary fallback={<p>error</p>}>
        <VideoSectionSuspense/>
      </ErrorBoundary>
    </Suspense>
  )
}

  const VideosSectionSkeleton=()=>{
    return(
      <>
        <div className="border-y">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6 w-[510px]">Video</TableHead>
              <TableHead>Visibility</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Views</TableHead>
              <TableHead className="text-right">Comments</TableHead>
              <TableHead className="text-right pr-6">Likes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({length:5}).map((_,index)=>(
              <TableRow key={index}>
                <TableCell className='pl-6'>
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-20 w-36"/>
                    <div className="flex flex-col gap-2">
                      <Skeleton className="h-4 w-[100px]"/>
                      <Skeleton className="h-3 w-[150px]"/>
                    </div>
                  </div>
                  </TableCell>
                <TableCell><Skeleton className="h-4 w-20"/></TableCell>   
                <TableCell><Skeleton className="h-4 w-20"/></TableCell>   
                <TableCell><Skeleton className="h-4 w-24"/></TableCell>   
                <TableCell className="text-right"><Skeleton className="h-4 w-12 ml-auto"/></TableCell>   
                <TableCell className="text-right"><Skeleton className="h-4 w-12 ml-auto"/></TableCell>   
                <TableCell className="text-right"><Skeleton className="h-4 w-12 ml-auto"/></TableCell>   
              </TableRow>
            ))}
          </TableBody>
          </Table>
        </div>
      </>
    )
  }
```

## Create video form page

### modules/studio/server/procedures.ts

```ts
export const studioRouter=createTRPCRouter({
  getOne:protectedProcedure
  .input(
    z.object({
      id:z.string().uuid()}))
    .query(async({ctx,input})=>{
      const{id:userId}=ctx.user;
      const{id}=input;
      const[video]=await db
            .select()
            .from(videos)
            .where(and(
              eq(videos.id,id),
              eq(videos.userId,userId)
            ));
            if(!video){
              throw new TRPCError({code:"NOT_FOUND"})
            }
          return video;  
    }),
    })
```

### create src/app/(studio)/studio/videos/[videoId]/page.tsx

```tsx
import { VideoView } from "@/modules/studio/ui/views/video-view";
import { HydrateClient, trpc } from "@/trpc/server";

/* 告诉 Next.js：“这个页面 每次请求都要重新生成，不要缓存、不要预渲染。”适用于内容实时变化或需要请求数据库/外部 API 的页面 */
export const dynamic="force-dynamic";
interface PageProps{
  params:Promise<{videoId:string}>
}

const Page = async ({params}:PageProps) => {
  const {videoId}=await params;
  void trpc.studio.getOne.prefetch({id:videoId});

  return (
    <HydrateClient>
      <VideoView videoId={videoId}/>
    </HydrateClient>
  )
}

export default Page
```

### Create modules/studio/ui/views/video-view.tsx

```tsx
import { FormSection } from "../sections/form-section";

interface PageProps{
  videoId:string;
}
export const VideoView=({videoId}:PageProps)=>{
  return(
    <div className="px-4 pt-2.5 max-w-screen-lg">
      <FormSection videoId={videoId}/>
    </div>
  )
}
```

### create modules/studio/ui/sections/form-section.tsx

```tsx
"use client";

import { trpc } from "@/trpc/client";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

interface FormSectionProps{
  videoId:string
}

export const FormSection=({videoId}:FormSectionProps)=>{
  return(
    <Suspense fallback={<FormSectionSkeleton/>}>
    <ErrorBoundary fallback={<p>Error</p>}>
    <FormSectionSuspense videoId={videoId}/>
    </ErrorBoundary>
    </Suspense>
  )
}
const FormSectionSkeleton=()=>{
  return <p>Loading...</p>
}

 const FormSectionSuspense=({videoId}:FormSectionProps)=>{
  const [video]=trpc.studio.getOne.useSuspenseQuery({id:videoId})
  return(
    <div>
      {JSON.stringify(video)}
    </div>
  )
}
```

## create  form-video

bun add drizzle-zod@0.7.0

### src/db/schema.ts

//这行代码是用 Drizzle ORM 提供的工具函数，为你的数据库表 videos 自动生成 表单校验/类型检查用的 Zod schema

```ts
//生成一个用于更新数据时的 Zod schema。
export const videoUpdateSchema=createUpdateSchema(videos);
```

### mudules/studio/ui/sections/form-section.tsx 之 form type validation

```tsx
const form=useForm<z.infer<typeof videoUpdateSchema>>({
    resolver:zodResolver(videoUpdateSchema),
    defaultValues:video,
  });
  //这里的 data 就是用户在表单里填写并通过校验后的内容
  const onSubmit= async (data:z.infer<typeof videoUpdateSchema>)=>{
    console.log(data);
  }

  return(
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold">Video details</h1>
        <p className="text-sm text-muted-foreground">Manage your video details</p>  
      </div>
      <div className="flex items-center gap-x-2">
        <Button type="submit" disabled={false}>
          Save
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVerticalIcon/>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <TrashIcon className="size-4 mr-2"/>
                Delete
              </DropdownMenuItem>    
          </DropdownMenuContent>

        </DropdownMenu>
      </div>
    </div>
    </form>
    </Form>
```

### mudules/studio/ui/sections/form-section.tsx 之add form element

```tsx
"use client";
import{z} from 'zod';
import { Button } from "@/components/ui/button";
import { trpc } from "@/trpc/client";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import{
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
}from "@/components/ui/dropdown-menu";
import { MoreVerticalIcon, TrashIcon } from "lucide-react";
import {useForm} from "react-hook-form";
// 它是一个让 react-hook-form 可以使用 Zod 进行表单校验的适配器。
import{zodResolver} from "@hookform/resolvers/zod";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormLabel,
  FormMessage,
  FormItem,
}from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
}from "@/components/ui/select";
import { videoUpdateSchema } from '@/db/schema';


interface FormSectionProps{
  videoId:string
}

export const FormSection=({videoId}:FormSectionProps)=>{
  return(
    <Suspense fallback={<FormSectionSkeleton/>}>
    <ErrorBoundary fallback={<p>Error</p>}>
    <FormSectionSuspense videoId={videoId}/>
    </ErrorBoundary>
    </Suspense>
  )
}
const FormSectionSkeleton=()=>{
  return <p>Loading...</p>
}

  const FormSectionSuspense=({videoId}:FormSectionProps)=>{
  const [video]=trpc.studio.getOne.useSuspenseQuery({id:videoId})
	
  const form=useForm<z.infer<typeof videoUpdateSchema>>({
    resolver:zodResolver(videoUpdateSchema),
    defaultValues:video,
  });
  //这里的 data 就是用户在表单里填写并通过校验后的内容
  const onSubmit= async (data:z.infer<typeof videoUpdateSchema>)=>{
    console.log(data);
  }

  return(
    //把 React Hook Form 提供的表单上下文传递给它内部的子组件，这样 <FormField>、<FormItem>、<FormMessage> 等组件就都能访问表单状态（错误信息、字段值等）。
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold">Video details</h1>
        <p className="text-sm text-muted-foreground">Manage your video details</p>  
      </div>
      <div className="flex items-center gap-x-2">
        <Button type="submit" disabled={false}>
          Save
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVerticalIcon/>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <TrashIcon className="size-4 mr-2"/>
                Delete
              </DropdownMenuItem>    
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div className="space-y-8 lg:col-span-3">
        <FormField 
        control={form.control}
        name="title"
        render={({field})=>(
          <FormItem>
            <FormLabel>
              Title
              {/* TODO:Add AI generate */}
            </FormLabel>
            <FormControl>
              <Input
              {...field}
              placeholder="Add a title to your video"
              />
            </FormControl>
            <FormMessage/>
          </FormItem>
        )}
        />
      </div>
    </div>
    </form>
    </Form>
  )
}
```

### add description and category form

### src/app/studio/(studio)/videos/[videoId]/page.tsx

```tsx
  void trpc.categories.getMany.prefetch();
```

### mudules/studio/ui/sections/form-section.tsx

```tsx
  const [categories]=trpc.categories.getMany.useSuspenseQuery();  

<FormField 
              control={form.control}
              name="description"
              render={({field})=>(
                <FormItem>
                  <FormLabel>
                    Description
                    {/* TODO:Add AI generate */}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                    {...field}
                    value={field.value ?? ""}
                    rows={10}
                    className="resize-none pr-10"
                    placeholder="Add a description to your video"
                    />
                    </FormControl>
                    <FormMessage/>
                    </FormItem>
                    )}
                    />
                    {/* TODO:Add thumbnail field here */}
        <FormField 
              control={form.control}
              name="categoryId"
              render={({field})=>(
                <FormItem>
                  <FormLabel>
                    Category
                  </FormLabel>
                  <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value ?? undefined}
                  >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="select a category"/>
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category)=>(
                        <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                      ))}
                    </SelectContent>
                    </Select>
                    <FormMessage/>
                    </FormItem>
                    )}
                    />          
```

## Update Video

### src/modeules/videos/server/procedures.ts

```ts
export const videosRouter=createTRPCRouter({ 
  update:protectedProcedure
    .input(videoUpdateSchema)
    .mutation(async({ctx,input})=>{
      const {id:userId}=ctx.user;
      if(!input.id){
        throw new TRPCError({code:"BAD_REQUEST"})
      }
      const [updatedVideo]=await db
          .update(videos)
          .set({
            title:input.title,
            description:input.description,
            categoryId:input.categoryId,
            visibility:input.visibility,
            updatedAt:new Date(),
          })
          .where(and(
            eq(videos.id,input.id),
            eq(videos.userId,userId)
          ))
          .returning();

          if(!updatedVideo){
            throw new TRPCError({code:"NOT_FOUND"})
          }
    }),
```

## Display video player 

### Create src/modules/videos/ui/components/video-player.tsx

```tsx
"use client";
import MuxPlayer from "@mux/mux-player-react";
interface VideoPlayerProps{
  playbackId?:string|null|undefined;
  thumbnailUrl?:string|null|undefined;
  autoPlay?:boolean;
  onPlay?:()=>void;
}
export const VideoPlayer=({
  playbackId,
  thumbnailUrl,
  autoPlay,
  onPlay
}:VideoPlayerProps)=>{
  if(!playbackId) return null;

  return (
    <MuxPlayer
    playbackId={playbackId}
    poster={thumbnailUrl || "placeholder.svg"}
    playerInitTime={0}
    autoPlay={autoPlay}
    thumbnailTime={0}
    className="w-full h-full object-contain"
    accentColor="#FF2056"
    onPlay={onPlay}
    />
  )
}
```

bun add @mux/mux-player-react@3.2.4

## Add video links 

### mudules/studio/ui/sections/form-section.tsx

```tsx
//TODO:Change if deploying outside of Vercel
  const fullUrl=`${process.env.VERCEL_URL || "http://localhost:3000"}/videos/${videoId}`
  const[isCopied,setIsCopied]=useState(false);
  const onCopy= async ()=>{
    //navigator是浏览器提供的一个全局对象，代表“当前浏览器的环境信息”。
    //navigator.clipboard是navigator的一个属性，表示剪贴板操作的接口对象。出于安全性，这个接口必须在用户交互中调用（比如点击按钮），否则会被浏览器拒绝。
    //writeText(fullUrl)这是 clipboard 上的方法，用来把文本写入剪贴板。参数 fullUrl 是你想要复制的字符串。
    await navigator.clipboard.writeText(fullUrl);
    setIsCopied(true);

    setTimeout(()=>{
      setIsCopied(false)
    },2000);
  }
  return(
  	<Button
      type="button"
      variant="ghost"
      size="icon"
      className="shrink-0"
      onClick={onCopy}
      disabled={isCopied}
    >
  	 {isCopied ? <CopyCheckIcon/> :<CopyIcon/>}
   	</Button>
```

## Add visibility form 

### mudules/studio/ui/sections/form-section.tsx

```tsx
				<FormField 
              control={form.control}
              name="visibility"
              render={({field})=>(
                <FormItem>
                  <FormLabel>
                    Visibility
                  </FormLabel>
                  <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value ?? undefined}
                  >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select visibility"/>
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="public">
                        <div className="flex items-center">
                        <Globe2Icon className="size-4 mr-2"/>
                        Public
                        </div>
                      </SelectItem>
                      <SelectItem value="private">
                        <div className="flex items-center">
                        <LockIcon className="size-4 mr-2"/>
                        Private
                        </div>
                      </SelectItem>
                    </SelectContent>
                    </Select>
                    <FormMessage/>
                    </FormItem>
                    )}
                    />       
```

## 点击create button后，上传文件成功后，跳转到视频详情页

### src/modules/studio/ui/components/studio-upload-modal.tsx

```tsx
const router=useRouter(); 
const onSuccess=()=>{
    if(!create.data?.video.id) return;
    create.reset();
    //这行代码会跳转到视频详情或编辑页面
    router.push(`/studio/videos/${create.data.video.id}`)
  }
  
  return (
    <>
    <ResponsiveModal
      title="Upload a video"
      open={!!create.data?.url}
      //就像你填表单提交后，表单状态记住了结果（比如“提交成功”），但你希望再次打开时是“干净的”，就要重置。
      onOpenChange={()=>create.reset()}
    > 
      {create.data?.url ? <StudioUploader endpoint={create.data.url} onSuccess={onSuccess}/>:<Loader2Icon/>}
    </ResponsiveModal>
```

## Add delete functionality

### modules/videos/server/procedures.ts

```ts
export const videosRouter=createTRPCRouter({ 
  remove:protectedProcedure
      .input(z.object({id:z.string().uuid()}))
      .mutation(async({ctx,input})=>{
        const {id:userId}=ctx.user;
        const [removedVideo]= await db
            .delete(videos)
            .where(and(
              eq(videos.id,input.id),
              eq(videos.userId,userId)
            ))
            .returning();
            if(!removedVideo){
              throw new TRPCError({code:"NOT_FOUND"})
            }
           return removedVideo; 
      }),
```

### modules/studio/ui/sections/form-section.tsx

```tsx
const remove=trpc.videos.remove.useMutation({
    // utils 是 tRPC 提供的客户端缓存工具（mutation、query 失效、刷新等）toast 是 弹出提示通知（如成功/失败提示）的工具，一般来自 sonner 或 react-hot-toast
    onSuccess:()=>{
      utils.studio.getMany.invalidate();
      toast.success("Video removed");
      router.push("/studio")
    },
    onError:()=>{
      toast.error("Something went wrong")
    }
  });

 {/* mutate() 是用来 执行 mutation 的方法（类似发送 POST 请求） */}
            <DropdownMenuItem onClick={()=>remove.mutate({id:videoId})}>
              <TrashIcon className="size-4 mr-2"/>
                Delete
              </DropdownMenuItem>  
```

# Video 15 Video thumbnails

## Requirements

We want to custom our thumbnail and restore our thumbnail ,we use uploadthing to implement it  

## Workflow

![image-20250721132926683](/Users/a1/Library/Application Support/typora-user-images/image-20250721132926683.png)

![image-20250721132953130](/Users/a1/Library/Application Support/typora-user-images/image-20250721132953130.png)

## Integrate UploadThing

https://uploadthing.com/dashboard/meisuqi-personal-team

### create a new app-->app name :my-tube-->create app

### api keys-->copy to .env.loacal

```
UPLOADTHING_TOKEN='eyJhcGlLZXkiOiJza19saXZlX2FiNjQzMjYxNzlmMjU0NWNkM2M2ODBhZDNlZjc1M2M3MWQwOTZmYzQ0YWQ0ZDcxYzVlMTRlYjA5MTNiMDEyNTUiLCJhcHBJZCI6ImZicWg2b2RrOGgiLCJyZWdpb25zIjpbInNlYTEiXX0='
```

### docs-->next.js App Router

bun add uploadthing@7.4.4

bun add @uploadthing/react@7.1.5

#### Set Up A FileRouter

##### creat app/api/uploadthing/core.ts

##### create app/api/uploadthing/route.ts

### create the upload thing components

#### create src/lib/uploadthing.ts

### Add uploadthing's style

#### tailwind.config.ts

```ts
import { withUt } from "uploadthing/tw";
export default withUt({
  //Wrap Tailwind config with the withUt helper. 
  
})
```

### Add thumbnail field

#### src/modules/studio/ui/sections/form-section.tsx

```tsx
/* TODO:Add thumbnail field here */}
                <FormField
                name="thumbnailUrl"
                control={form.control}
                render={()=>(
                  <FormItem>
                    <FormLabel>Thumbnail</FormLabel>
                    <FormControl>
                      {/* border-dashed是Tailwind CSS 提供的一个边框样式类名，用于把元素的边框设为 虚线 */}
                      <div className="p-0.5 border border-dashed border-neutral-400 relative h-[84px] w-[153px] group">
                      <Image
                      src={video.thumbnailUrl ?? THUMBNAIL_FALLBACK}
                      className="object-cover"
                      fill
                      alt="Thumbnail"
                      />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                          type="button"
                          size="icon"
                          className="bg-black/50 hover:bg-black/50 absolute top-1 right-1 rounded-full opacity-100 md:opacity-0 group-hover:opacity-100 duration-300 size-7"
                          >
                            <MoreVerticalIcon className=" text-white"/>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" side="right">
                          <DropdownMenuItem>
                            <ImagePlusIcon className="size-4 mr-1"/>
                              Change
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <SparklesIcon className="size-4 mr-1"/>
                              AI-Generated
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <RotateCcwIcon className="size-4 mr-1"/>
                              Restore
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      </div>
                    </FormControl>
                  </FormItem>
                )}
                />  
```

### Add thumbnail field

#### src/modules/studio/ui/sections/form-section.tsx

```tsx
/* TODO:Add thumbnail field here */}
                <FormField
                name="thumbnailUrl"
                control={form.control}
                render={()=>(
                  <FormItem>
                    <FormLabel>Thumbnail</FormLabel>
                    <FormControl>
                      {/* border-dashed是Tailwind CSS 提供的一个边框样式类名，用于把元素的边框设为 虚线 */}
                      <div className="p-0.5 border border-dashed border-neutral-400 relative h-[84px] w-[153px] group">
                      <Image
                      src={video.thumbnailUrl ?? THUMBNAIL_FALLBACK}
                      className="object-cover"
                      fill
                      alt="Thumbnail"
                      />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                          type="button"
                          size="icon"
                          className="bg-black/50 hover:bg-black/50 absolute top-1 right-1 rounded-full opacity-100 md:opacity-0 group-hover:opacity-100 duration-300 size-7"
                          >
                            <MoreVerticalIcon className=" text-white"/>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" side="right">
                          <DropdownMenuItem>
                            <ImagePlusIcon className="size-4 mr-1"/>
                              Change
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <SparklesIcon className="size-4 mr-1"/>
                              AI-Generated
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <RotateCcwIcon className="size-4 mr-1"/>
                              Restore
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      </div>
                    </FormControl>
                  </FormItem>
                )}
                />  
```

#### create src/modules/studio/components/thumbnail-upload-modal.tsx

```tsx
import { ResponsiveModal} from "@/components/responsive-dialog";

interface ThumbnailUploadModalProps{
  videoId:string;
  open:boolean;
  onOpenChange:(open:boolean)=>void;
};

export const ThumbnailUploadModal=({
  videoId,
  open,
  onOpenChange,
}:ThumbnailUploadModalProps)=>{
  return(
  <ResponsiveModal
  title="Upload a thumbnail"
  open={open}
  onOpenChange={onOpenChange}
  >
    <p>Hello</p>
  </ResponsiveModal>
 )
}
```

#### src/modules/studio/ui/sections/form-section.tsx

```tsx
 const FormSectionSuspense=({videoId}:FormSectionProps)=>{
 const [thumbnailModalOpen,setThumbnailModalOpen]=useState(false);
 
 return(
    //把 React Hook Form 提供的表单上下文传递给它内部的子组件，这样 <FormField>、<FormItem>、<FormMessage> 等组件就都能访问表单状态（错误信息、字段值等）。
    <>
    <ThumbnailUploadModal
    open={thumbnailModalOpen}
    onOpenChange={setThumbnailModalOpen}
    videoId={videoId}
    />
    
    <DropdownMenuItem onClick={()=>setThumbnailModalOpen(true)}>
                            <ImagePlusIcon className="size-4 mr-1"/>
                              Change
                          </DropdownMenuItem>
                          <DropdownMenuItem>
  </>           
```

#### src/app/api/uploadthing/core.ts

```ts
import { db } from "@/db";
import { users, videos } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { z } from "zod";

//f 定义文件上传规则的入口。
const f = createUploadthing();
//定义上传路由：thumbnailUploader
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  thumbnailUploader: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
  //输入校验 .input(...)
  .input(z.object({
    videoId:z.string().uuid(),
  }))
    // 权限控制 .middleware(...)
    .middleware(async ({ input }) => {
      // This code runs on your server before upload
      const {userId:clerkUserId} = await auth();
      if (!clerkUserId) throw new UploadThingError("Unauthorized");
      //we have to check if user ID is the user ID from the database not just the clerk userID
      const[user]=await db
            .select()
            .from(users)
            .where(eq(users.clerkId,clerkUserId));
            if(!user) throw new UploadThingError("Unauthorized")
      // 如果成功，返回 user + videoId，将传入下一个阶段（上传成功回调）。
      return { user,...input};
    })
    //上传成功后 .onUploadComplete(...)
    .onUploadComplete(async ({ metadata, file }) => {
      await db
        .update(videos)
        .set({
          //把文件链接 file.url 写入数据库 videos.thumbnailUrl
          thumbnailUrl:file.url,
        })
        .where(and(
          eq(videos.id,metadata.videoId),
          eq(videos.userId,metadata.user.id)
          ))
      // 最后把 userId 返回客户端（可选）。
      return { uploadedBy: metadata.user.id };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
```

#### create src/modules/studio/components/thumbnail-upload-modal.tsx

```tsx
import { ResponsiveModal} from "@/components/responsive-dialog";
import { UploadDropzone } from "@/lib/uploadthing";
import { trpc } from "@/trpc/client";

interface ThumbnailUploadModalProps{
  videoId:string;
  open:boolean;
  onOpenChange:(open:boolean)=>void;
};

export const ThumbnailUploadModal=({
  videoId,
  open,
  onOpenChange,
}:ThumbnailUploadModalProps)=>{
  const utils=trpc.useUtils();
  const onUploadComplete=()=>{
    onOpenChange(false);
    utils.studio.getOne.invalidate({id:videoId});
    utils.studio.getMany.invalidate();

  }
  return(
  <ResponsiveModal
  title="Upload a thumbnail"
  open={open}
  onOpenChange={onOpenChange}
  >
   <UploadDropzone
    endpoint="thumbnailUploader"
    input={{videoId}}
    onClientUploadComplete={onUploadComplete}
   />
  </ResponsiveModal>
  )
  }
```

#### Error

当点击上传 thumbnail 文件并上传文件后，出现以下问题：

![image-20250721175904785](/Users/a1/Library/Application Support/typora-user-images/image-20250721175904785.png)

#### nextConfig.ts

```ts
		{
      protocol:"https",
      hostname:"utfs.io",
    }
```

### Add thumbnail restore functionality

After restoring or after uploading a new file

how do we get rid of the old ones and make sure they don't unnecessarily populate our storage .

#### src/modules/videos/server/procedures.ts

```ts
export const videosRouter=createTRPCRouter({ 
  restoreThumbnail:protectedProcedure
      .input(z.object({id:z.string().uuid()}))
      .mutation(async({ctx,input})=>{
        const {id:userId}=ctx.user;
        const [existingVideo]=await db
          .select()
          .from(videos)
          .where(and(
            eq(videos.id,input.id),
            eq(videos.userId,userId)
          ));
         if(!existingVideo){
          throw new TRPCError({code:"NOT_FOUND"})
         }   
         if(!existingVideo.muxPlaybackId){
          throw new TRPCError({code:"BAD_REQUEST"})  
         }
         const thumbnailUrl=`https://image.mux.com/${existingVideo.muxPlaybackId}/thumbnail.jpg`;
          const [updatedVideo]=await db
            .update(videos)
            .set({thumbnailUrl})
            .where(and(
              eq(videos.id,input.id),
              eq(videos.userId,userId),
            ))
            .returning(); 
            return updatedVideo;
      }),
```

#### src/modules/studio/ui/sections/form-section.tsx

```tsx
const restoreThumbnail=trpc.videos.restoreThumbnail.useMutation({
    // utils 是 tRPC 提供的客户端缓存工具（mutation、query 失效、刷新等）toast 是 弹出提示通知（如成功/失败提示）的工具，一般来自 sonner 或 react-hot-toast
    onSuccess:()=>{
      utils.studio.getMany.invalidate();
      utils.studio.getOne.invalidate({id:videoId});
      toast.success("Thumbnail restored");
      router.push("/studio")
    },
    onError:()=>{
      toast.error("Something went wrong")
    }
  });

<DropdownMenuItem onClick={()=>restoreThumbnail.mutate({id:videoId})}>
                            <RotateCcwIcon className="size-4 mr-1"/>
                              Restore
                          </DropdownMenuItem>
```

### Proper uploadthing clean-up

This code does the following: if a video already has a thumbnail, first delete the old thumbnail file from the server, and then clear the thumbnail information in the database for that video.

#### src/db/schema.ts

```ts
export const videos=pgTable("videos",{
	thumbnailKey:text("thumbnail_key"),
	previewKey:text("preview_key"),
})
```

#### src/app/api/uploadthing/core.ts

```ts
.middleware(async ({ input }) => {
      // This code runs on your server before upload
      const {userId:clerkUserId} = await auth();
      if (!clerkUserId) throw new UploadThingError("Unauthorized");
      //we have to check if user ID is the user ID from the database not just the clerk userID
      const[user]=await db
            .select()
            .from(users)
            .where(eq(users.clerkId,clerkUserId));
            if(!user) throw new UploadThingError("Unauthorized");
      const[existingVideo]=await db
          .select({
            thumbnailKey:videos.thumbnailKey,
          })
          .from(videos)
          .where(and(
            eq(videos.id,input.videoId),
            eq(videos.userId,user.id),
          ))        
          if(!existingVideo) throw new UploadThingError("NOT FOUND")
          if((existingVideo.thumbnailKey){
            const utapi=new UTApi();
            await utapi.deleteFiles(existingVideo.thumbnailKey);
            await db
                  .update(videos)
                  .set({thumbnailKey:null,thumbnailUrl:null})
                  .where(and(
                    eq(videos.id,input.videoId),
                    eq(videos.userId,user.id),
                  ))
          }
      // 如果成功，返回 user + videoId，将传入下一个阶段（上传成功回调）。
      return { user,...input};
    })
```

#### src/modules/videos/server/procedures.ts

this is due to delete the thumbnail in uploadthing after click restore button

```ts
restoreThumbnail:protectedProcedure
if(!existingVideo){
          throw new TRPCError({code:"NOT_FOUND"})
         }   
         if(existingVideo.thumbnailKey){
          const utapi=new UTApi();
          await utapi.deleteFiles(existingVideo.thumbnailKey);
          await db
                .update(videos)
                .set({thumbnailKey:null,thumbnailUrl:null})
                .where(and(
                  eq(videos.id,input.id),
                  eq(videos.userId,userId),
                ))
        }
```

# Chapter16 AI background jobs

## Description

we can use deepseek to auto generate title and description by get the script

## Workflow

![image-20250723144109434](/Users/a1/Library/Application Support/typora-user-images/image-20250723144109434.png)

![image-20250723144343451](/Users/a1/Library/Application Support/typora-user-images/image-20250723144343451.png)

## Quickstarts-->TypeScript-->Next.js

### Step1 Installation

```
bun add @upstash/workflow@0.2.6
```

### Step2 Configure Environment Variables

.env.local

> 当你用代码通过 `fetch` 等方式发送 HTTP 请求到 QStash 时，需要在请求头中带上这个 Token，以表明你是谁、你是否有权限使用 QStash 服务。

```
QSTASH_TOKEN=eyJVc2VySUQiOiI5NDhjYjg5Yy1lMjk5LTQ1OTYtOGRiMi00MDhkMmQxY2ZmYjMiLCJQYXNzd29yZCI6IjkzYTA4OTMxYTNjNTQ3ZDc5NjJkMTgxOTM0OTJhNmNkIn0=
```

https://console.upstash.com/workflow?teamid=0&tab=details

#### Local Tunnel

.env.local

```
UPSTASH_WORKFLOW_URL=https://polite-cockatoo-unique.ngrok-free.app
```

### Step 3: Create a Workflow Endpoint

#### src/app/api/videos/workflows/title/route.ts

```ts
import { serve } from "@upstash/workflow/nextjs"
export const { POST } = serve(
  async (context) => {
    await context.run("initial-step", () => {
      console.log("initial step ran")
    })

    await context.run("second-step", () => {
      console.log("second step ran")
    })
  }
)
```

curl -X POST http://localhost:3000/api/videos/workflows/title

## Secure an endpoint

.env.local

```
QSTASH_CURRENT_SIGNING_KEY=sig_6gCKATZdkMASqbyK3ywTUP9DPNUD
QSTASH_NEXT_SIGNING_KEY=sig_5oBt9KyMyTGKQ2AUk29C2S6Kk47z
```

## Add dedicated button for AI Title

###  1. Using `client.trigger` (Recommended)

#### create src/lib/workflow.ts

```ts
import { Client } from "@upstash/workflow";
export const workflow = new Client({ token: process.env.QSTASH_TOKEN!});
```

### src/modules/videos/server/procedures.ts

```ts
export const videosRouter=createTRPCRouter({ 
    // 这段代码是一个使用 tRPC 定义的受保护 mutation（变异操作），用于通过 Upstash QStash 触发一个生成视频缩略图的工作流。
    generateTitle:protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ctx,input})=>{
          const{id:userId}=ctx.user;
          const{workflowRunId}=await workflow.trigger({
            url:`${process.env.UPSTASH_WORKFLOW_URL}/api/videos/workflows/title`,
            //know which user triggered this background job 
            body:{userId,videoId:input.id},
            retries:3,
          })  
          return workflowRunId;
        }),
```

### Deepseek API

.env.local

```
DEEPSEEK_API_KEY=sk-70ae5b24c41b486ea4b9ddbe69f7f4e0
```

https://platform.deepseek.com/api_keys

### src/app/api/videos/workflows/title/route.ts

```ts
import { db } from "@/db";
import { videos } from "@/db/schema";
import { serve } from "@upstash/workflow/nextjs";
import { and, eq } from "drizzle-orm";

interface InputType {
  userId: string;
  videoId: string;
}

const TITLE_SYSTEM_PROMPT = `Your task is to generate an SEO-focused title for a YouTube video based on its transcript. Please follow these guidelines:
- Be concise but descriptive, using relevant keywords to improve discoverability.
- Highlight the most compelling or unique aspect of the video content.
- Avoid jargon or overly complex language unless it directly supports searchability.
- Use action-oriented phrasing or clear value propositions where applicable.
- Ensure the title is 3-8 words long and no more than 100 characters.
- ONLY return the title as plain text. Do not add quotes or any additional formatting.`;

export const { POST } = serve(async (context) => {
  const input = context.requestPayload as InputType;
  const { videoId, userId } = input;

  const video = await context.run("get-video", async () => {
    const [existingVideo] = await db
      .select()
      .from(videos)
      .where(
        and(eq(videos.id, videoId), eq(videos.userId, userId))
      );

    if (!existingVideo) {
      throw new Error("Not found");
    }

    return existingVideo;
  });
  //get transcript
  const transcript=await context.run("get-transcript",async()=>{
    //https://www.mux.com/docs/guides/add-autogenerated-captions-and-use-transcripts#retrieving-a-transcript
    const trackUrl=`https://stream.mux.com/${video.muxPlaybackId}/text/${video.muxTrackId}.txt`;
    const response =await fetch(trackUrl);
    const text=response.text();
    if(!text){
      throw new Error("Bad request")
    }
    return text;
  })
   
  const token = process.env.DEEPSEEK_API_KEY;
  if (!token) throw new Error("Missing DeepSeek API key");

  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: TITLE_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: transcript,
        },
      ],
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`DeepSeek API request failed with status ${response.status}`);
  }

  const data = await response.json();
  const title = data.choices[0]?.message?.content?.trim();
    if(!title){
      throw new Error("Bad request");
    }
  await context.run("update-video", async () => {
    await db
      .update(videos)
      .set({
        title: title || video.title,
      })
      .where(
        and(eq(videos.id, video.id), eq(videos.userId, video.userId))
      );
  });
});

```

### src/modules/studio/ui/sections/form-section.tsx

```tsx
  const generateTitle=trpc.videos.generateTitle.useMutation({
    // utils 是 tRPC 提供的客户端缓存工具（mutation、query 失效、刷新等）toast 是 弹出提示通知（如成功/失败提示）的工具，一般来自 sonner 或 react-hot-toast
    onSuccess:()=>{
     toast.success("Background job started",{description:"This may take some time"})
    },
    onError:()=>{
      toast.error("Something went wrong")
    }
  });

<FormLabel>
              <div className='flex items-center gap-x-2'>
              Title
              <Button
              size="icon"
              variant="outline"
              type="button"
              className='rounded-full size-6 [&_svg]:size-3'
              onClick={()=>generateTitle.mutate({id:videoId})}
              disabled={generateTitle.isPending || !video.muxTrackId}
              >
                {generateTitle.isPending
                  ? <Loader2Icon className="animate-spin"/>
                  :<SparklesIcon/>
                }
              </Button>
              </div>
              {/* TODO:Add AI generate */}
            </FormLabel>
```

## Add dedicated button for AI description

### src/modules/videos/server/procedures.ts

```ts
generateDescription:protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ctx,input})=>{
          const{id:userId}=ctx.user;
          const{workflowRunId}=await workflow.trigger({
            url:`${process.env.UPSTASH_WORKFLOW_URL}/api/videos/workflows/description`,
            //know which user triggered this background job 
            body:{userId,videoId:input.id},
            retries:3,
          })  
          return workflowRunId;
        }),
```

### src/app/api/videos/workflows/description/route.ts

```ts
import { db } from "@/db";
import { videos } from "@/db/schema";
import { serve } from "@upstash/workflow/nextjs";
import { and, eq } from "drizzle-orm";

interface InputType {
  userId: string;
  videoId: string;
}

const DESCRIPTION_SYSTEM_PROMPT = `Your task is to summarize the transcript of a video. Please follow these guidelines:
- Be brief. Condense the content into a summary that captures the key points and main ideas without losing important details.
- Avoid jargon or overly complex language unless necessary for the context.
- Focus on the most critical information, ignoring filler, repetitive statements, or irrelevant tangents.
- ONLY return the summary, no other text, annotations, or comments.
- Aim for a summary that is 3-5 sentences long and no more than 200 characters.`;

export const { POST } = serve(async (context) => {
  const input = context.requestPayload as InputType;
  const { videoId, userId } = input;

  const video = await context.run("get-video", async () => {
    const [existingVideo] = await db
      .select()
      .from(videos)
      .where(
        and(eq(videos.id, videoId), eq(videos.userId, userId))
      );

    if (!existingVideo) {
      throw new Error("Not found");
    }

    return existingVideo;
  });
  //get transcript
  const transcript=await context.run("get-transcript",async()=>{
    //https://www.mux.com/docs/guides/add-autogenerated-captions-and-use-transcripts#retrieving-a-transcript
    const trackUrl=`https://stream.mux.com/${video.muxPlaybackId}/text/${video.muxTrackId}.txt`;
    const response =await fetch(trackUrl);
    const text=response.text();
    if(!text){
      throw new Error("Bad request")
    }
    return text;
  })
   
  const token = process.env.DEEPSEEK_API_KEY;
  if (!token) throw new Error("Missing DeepSeek API key");

  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: DESCRIPTION_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: transcript,
        },
      ],
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`DeepSeek API request failed with status ${response.status}`);
  }

  const data = await response.json();
  const description = data.choices[0]?.message?.content?.trim();
    if(!description){
      throw new Error("Bad request");
    }
  await context.run("update-video", async () => {
    await db
      .update(videos)
      .set({
        description: description || video.description,
      })
      .where(
        and(eq(videos.id, video.id), eq(videos.userId, video.userId))
      );
  });
});

```

### src/modules/studio/ui/sections/form-section.tsx

```tsx
  const generateDescription=trpc.videos.generateDescription.useMutation({
    // utils 是 tRPC 提供的客户端缓存工具（mutation、query 失效、刷新等）toast 是 弹出提示通知（如成功/失败提示）的工具，一般来自 sonner 或 react-hot-toast
    onSuccess:()=>{
     toast.success("Background job started",{description:"This may take some time"})
    },
    onError:()=>{
      toast.error("Something went wrong")
    }
  });

  <FormLabel>
                  <div className='flex items-center gap-x-2'>
              Description
              <Button
              size="icon"
              variant="outline"
              type="button"
              className='rounded-full size-6 [&_svg]:size-3'
              onClick={()=>generateDescription.mutate({id:videoId})}
              disabled={generateDescription.isPending ||!video.muxTrackId}
              > 
                {generateDescription.isPending
                  ? <Loader2Icon className="animate-spin"/>
                  :<SparklesIcon/>
                }
              </Button>
              </div>
                  </FormLabel>
```

# Chapter17 video page

## Requirements

Do single video page basic layout.

we will have a video player that can play the video ,

We also need the user Info(including avatar, name,subscribers and edit button),and we can also like or dislike the vidoe

After we watched a video ,it shoule have the viewer counts

and we will have the comment area and suggestion area

we can also do some operations in our video menu,like share, add to list or remove this video.

## Workflow

![image-20250725155700097](/Users/a1/Library/Application Support/typora-user-images/image-20250725155700097.png)

![image-20250725155828879](/Users/a1/Library/Application Support/typora-user-images/image-20250725155828879.png)

![image-20250725155849989](/Users/a1/Library/Application Support/typora-user-images/image-20250725155849989.png)

## Create video "getOne" procedure

### src/modules/videos/server/procedures.ts

```ts
 export const videosRouter=createTRPCRouter({ 
    getOne:baseProcedure
        .input(z.object({id:z.string().uuid()}))
        .query(async ({input})=>{
          const [existingVideo]=await db
            .select({
              ...getTableColumns(videos),
              user:{
                ...getTableColumns(users),
              }
            })
            .from(videos)
            .innerJoin(users,eq(users.id,videos.userId))
            .where(eq(videos.id,input.id))
            if(!existingVideo){
              throw new TRPCError({code:"NOT_FOUND"})
            }
            return existingVideo;
        }),
```

## Create video home page

### Create src/app/(home)/videos/[videoId]/page.tsx

```tsx
import { HydrateClient, trpc } from '@/trpc/server';
interface PageProps{
  params:Promise<{
    videoId:string
  }>
}
const Page = async ({params}:PageProps) => {
  const {videoId}= await params;
  void trpc.videos.getOne.prefetch({id: videoId});
  return (
    <HydrateClient>
      <VideoView videoId={videoId}/>
    </HydrateClient>
  )
}

export default Page
```

### create src/modules/videos/ui/views/video-views.tsx

```tsx
import { VideoSection } from "../sections/video-section";
interface VideoViewProps{
  videoId:string;
}
export const VideoView=({videoId}:VideoViewProps)=>{
  return(
    <div className="flex flex-col max-w-[1700px] mx-auto pt-2.5 px-4 mb-10">
      <div className="flex flex-col xl:flex-row gap-6">
        {/* min-w-0：设置元素的最小宽度（min-width）为 0 */}
        <div className="flex-1 min-w-0">
          <VideoSection videoId={videoId}/>
        </div>
      </div>
    </div>
  )
}
```

### src/modules/videos/ui/sections/video-section.tsx

```tsx
"use client"

import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { VideoPlayer, VideoPlayerSkeleton } from "../components/video-player";
import { VideoBanner } from "../components/video-banner";
import { VideoTopRow, VideoTopRowSkelton } from "../components/video-top-row";
import { useAuth } from "@clerk/nextjs";

interface VideoSectionProps{
  videoId:string;
}

export const VideoSection=({videoId}:VideoSectionProps)=>{
  return(
    <Suspense fallback={<VideoSectionSkeleton/>}>
      <ErrorBoundary fallback={<p>Error</p>}>
        <VideoSectionSuspense videoId={videoId}/>
      </ErrorBoundary>
    </Suspense>
  )
}

const VideoSectionSkeleton=()=>{
  return (
    <>
    <VideoPlayerSkeleton/>
    <VideoTopRowSkelton/>
    </>
  )
}

const VideoSectionSuspense=({videoId}:VideoSectionProps)=>{
  const utils=trpc.useUtils();
  const {isSignedIn}=useAuth();
  const [video]=trpc.videos.getOne.useSuspenseQuery({id:videoId});
  const createView=trpc.videoViews.create.useMutation({
    onSuccess:()=>{
      //invalidate tells React Query to refetch this video's data (e.g., view count) because it's now outdated.
      utils.videos.getOne.invalidate({id:videoId})
    },

  }
  );
  const handlePlay=()=>{
    if(!isSignedIn) return;
    //如果用户已登录，就调用 createView.mutate()，向后端发送该视频的“观看记录”。
    //这里的 mutate() 通常来自 React Query 或 tRPC 的 mutation，用于执行数据更新操作（如新增记录）。
    createView.mutate({videoId});
  }
  return(
    <>
    {/* aspect-video：宽高比为视频比例（通常16:9） 
      video.muxStatus !== "ready"：如果视频还没准备好（可能还在上传或处理中）
      && "rounded-b-none"：那就把底部的圆角去掉
    */}
    <div className={cn(
      "aspect-video bg-black rounded-xl overflow-hidden relative",
       video.muxStatus !=="ready" && "rounded-b-none"
    )}>
      <VideoPlayer
      autoPlay
      onPlay={handlePlay}
      playbackId={video.muxPlaybackId}
      thumbnailUrl={video.thumbnailUrl}
      />
    </div>
    <VideoBanner status={video.muxStatus}/>
    <VideoTopRow video={video}/>
    </>
  )
}
```

### create src/modules/videos/types.ts

```ts
import {inferRouterOutputs} from "@trpc/server";
import {AppRouter} from "@/trpc/routers/_app";

export type VideoGetOneOutput=
       inferRouterOutputs<AppRouter>["videos"]["getOne"];     
```

### create src/modules/videos/ui/components/video-banner.tsx

```tsx
import { AlertTriangleIcon } from "lucide-react";
import {VideoGetOneOutput} from "../../types";

interface VideoBannerProps{
  // 声明一个变量或对象字段 status，它的类型等于 VideoGetOneOutput 类型中 muxStatus 这一项的类型。
  status:VideoGetOneOutput['muxStatus'];
}

export const VideoBanner=({status}:VideoBannerProps)=>{
   if(status==="ready") return null;
   return (
    <div className="bg-yellow-500 py-3 px-4 rounded-b-xl flex items-center gap-2">
      <AlertTriangleIcon className="size-4 text-black shrink-0"/>
      {/* line-clamp-1 makes the text display only 1 line and truncates(截断) the rest with an ellipsis（省略号）. */}
      <p className="text-xs md:text-sm font-medium text-black line-clamp-1">
        this video is still being processed.
      </p>
    </div>
   )

}
```

### create src/modules/videos/ui/components/video-top-row.tsx

```tsx
import { VideoGetOneOutput } from "../../types";
import { VideoOwner } from "./video-owner";

interface VideoTopRowProps{
  video:VideoGetOneOutput;
};

export const VideoTopRow=({video}:VideoTopRowProps)=>{
  return(
    <div className="flex flex-col gap-4 mt-4">
      <h1 className="text-xl font-semibold">{video.title}</h1>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <VideoOwner user={video.user} videoId={video.id}/>
      </div>
    </div>
  )
}
```

### create src/modules/videos/ui/components/video-owner.tsx

```tsx
import Link from "next/link";
import { VideoGetOneOutput } from "../../types";
import { UserAvatar } from "@/components/user-avatar";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { SubscriptionButton } from "@/modules/subscriptions/ui/components/subscription-button";

interface VideoOwnerProps{
  user:VideoGetOneOutput["user"],
  videoId:string;
};

export const VideoOwner=({user,videoId}:VideoOwnerProps)=>{
  const {userId:clerkUserId}=useAuth();
  return(
    <div className="flex items-center sm:items-start  justify-between sm:justify-start gap-3 min-w-0">
      <Link href={`/users/${user.id}`}>
        <div className="flex items-center gap-3 min-w-0">
          <UserAvatar size="lg" imageUrl={user.imageUrl} name={user.name}/>
            <UserInfo/>
            <span className="text-sm text-muted-foreground line-clamp-1 ">
              {/* TODO:properly fill subscriber count */}
              {0} subscribers
            </span>
        </div>
      </Link>
      {clerkUserId===user.clerkId ? (
        <Button
        variant="secondary"
        className="rounded-full"
        asChild
        >
          <Link href={`/studio/videos/${videoId}`}>
            Edit video
          </Link>
        </Button>
      ): (
        <SubscriptionButton
          onClick={()=>{}}
          disabled={false}
          isSubscribed={false}
          className="flex-none"
        />
      )} 
    </div>
  )}
```

### create src/modules/subscriptions/ui/components/subscription-button.tsx

```tsx
import {cn} from "@/lib/utils";
import {Button,ButtonProps} from "@/components/ui/button";

interface SubscriptionButtonProps{
  onClick:ButtonProps["onClick"];
  disabled:boolean;
  isSubscribed:boolean;
  className?:string;
  size?:ButtonProps["size"]
};
export const SubscriptionButton=({
  onClick,
  disabled,
  isSubscribed,
  className,
  size
}:SubscriptionButtonProps)=>{
  <Button
  size={size}
  variant={isSubscribed ? "secondary":"default"}
  className={cn("rounded-full",className)}
  onClick={onClick}
  disabled={disabled}
  >
    {isSubscribed ? "Unsubscribed":"Subscribe"}
  </Button>
}
```

### create src/modules/users/ui/components/user-info.tsx

```tsx
import {cva,type VariantProps} from "class-variance-authority";
import {cn} from "@/lib/utils";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

const userInfoVariants=cva("flex items-center gap-1",{
  variants:{
    size:{
      default:"[&_p]:text-sm [&_svg]:size-4",
      lg:"[&-p]:text-base [&_svg]:size-5 [&_svg]:font-medium [&_p]:text-back",
      sm:"[&_p]:text-xs [&_svg]:size-3.5",
    }
  },
  defaultVariants:{
    size:"default",
  },
});
interface UserInfoProps extends VariantProps<typeof userInfoVariants>{
  name:string;
  className?:string;
};
export const UserInfo=({
  name,
  className,
  size
}:UserInfoProps)=>{
  return(
    <div className={cn(userInfoVariants({size,className}))}>
      <Tooltip>
        <TooltipTrigger asChild>
          {/* line-clamp-1：limits text to only 1 line and truncates the rest with an ellipsis. */}
          <p className="text-gray-500  hover:text-gray-800 line-clamp-1">
              {name}
          </p>
        </TooltipTrigger>
        <TooltipContent align="center" className="bg-black/70">
          <p>
            {name}
          </p>
        </TooltipContent>
      </Tooltip>
    </div>
  )
}
```

### create src/modules/videos/ui/components/video-owner.tsx

```tsx
return(
    <div className="flex items-center sm:items-start  justify-between sm:justify-start gap-3 min-w-0">
      <Link href={`/users/${user.id}`}>
        <div className="flex items-center gap-3 min-w-0">
          <UserAvatar size="lg" imageUrl={user.imageUrl} name={user.name}/>
          <div className="flex flex-col gap-1 min-w-0">
            <UserInfo
            size="lg"
            name={user.name}
            /> 
```

![image-20250723201328020](/Users/a1/Library/Application Support/typora-user-images/image-20250723201328020.png)

## Create viewer reaction and video menu

### src/modules/videos/ui/components/video-top-row.tsx

```tsx
import { VideoGetOneOutput } from "../../types";
import { VideoMenu } from "./video-menu";
import { VideoOwner } from "./video-owner";
import { VideoReactions } from "./video-reactions";

interface VideoTopRowProps{
  video:VideoGetOneOutput;
};

export const VideoTopRow=({video}:VideoTopRowProps)=>{
  const utils=trpc.useUtils();
    const router=useRouter();
    const deleteVideo=trpc.videos.remove.useMutation({
      onSuccess:()=>{
        utils.videos.getOne.invalidate({id:video.id});
        utils.videos.getMany.invalidate();
        toast.success("Video has been successfully deleted")
        router.push('/');
      },
      onError:(error)=>{
         toast.error("Something went wrong") 
      }
    })
    const handleRemove=()=>{
      deleteVideo.mutate({id:video.id})
    }
  return(
    <div className="flex flex-col gap-4 mt-4">
      <h1 className="text-xl font-semibold">{video.title}</h1>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <VideoOwner user={video.user} videoId={video.id}/>
        <div className="flex overflow-x-auto sm:min-w-[calc(50%-6px)] sm:justify-end sm:overflow-visible pb-2 -mb-2 sm:pb-0 sm:mb-0 gap-2">
          <VideoReactions/>
          <VideoMenu videoId={video.id} variant="secondary" onRemove={handleRemove}/>
        </div>
      </div>
    </div>
  )
}
```

### create src/modules/videos/ui/components/video-reactions.tsx

```tsx
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { ThumbsDownIcon, ThumbsUpIcon } from 'lucide-react'
import React from 'react'
//TODO:properly implement viewer reactions
export const VideoReactions = () => {
  const viewerReaction:"like" | "dislike" = "like";
  return (
    //flex-none 表示这个元素 在 flex 布局中不允许伸缩，也不会自动缩放大小，它的尺寸完全由 width / height 或内容大小决定。
    <div className="flex items-center flex-none">
      <Button
        variant="secondary"
        className="rounded-l-full rounded-r-none gap-2 pr-4"
      >
      <ThumbsUpIcon className={cn("size-5",viewerReaction==="like" && "fill-black")}/>
      {1}
      </Button>
      {/* <Separator orientation="vertical" /> 是一个垂直分隔线组件，常用于并排布局中，将两个区域视觉上分开。 */}
      <Separator orientation='vertical' className="h-7"/>
      <Button
        variant="secondary"
        className="rounded-l-none rounded-r-full pl-3"
      >
      <ThumbsDownIcon className={cn("size-5",viewerReaction !=="like" && "fill-black")}/>
      {1}
      </Button>
    </div>
  )
}
```

### src/modules/videos/ui/components/video-menu.tsx

```tsx
import React, { useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { ListPlusIcon, MoreVertical, MoreVerticalIcon, ShareIcon, Trash2Icon } from 'lucide-react';
import { toast } from 'sonner';
import { APP_URL } from '@/constants';
import { PlaylistAddModal } from '@/modules/playlists/ui/components/playlist-add-modal';
interface VideoMenuProps{
  videoId:string;
  variant?:"ghost" | "secondary";
  onRemove?:()=>void;
}
export const VideoMenu = ({
  videoId,
  // 视觉效果是“轻量级、不打扰”的，常用于辅助操作，比如关闭、取消、导航
  variant="ghost",
  onRemove,
}:VideoMenuProps) => {
  const [isOpenPlaylistAddModal,setIsOpenPlaylistAddModal]=useState(false);
  const onShare=()=>{
    const fullUrl=`${APP_URL}/videos/${videoId}`;
    //It copies the text stored in the fullUrl variable to the user's clipboard.
    navigator.clipboard.writeText(fullUrl);
    toast.success("Link copied to the clipboard");
  }
  return (
    <>
    <PlaylistAddModal
    videoId={videoId}
    open={isOpenPlaylistAddModal}
    onOpenChange={setIsOpenPlaylistAddModal}
    />
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size="icon" className="rounded-full">
          <MoreVerticalIcon/>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e)=>e.stopPropagation()}>
        <DropdownMenuItem onClick={onShare}>
          <ShareIcon className="mr-2 size-4"/>
          Share
        </DropdownMenuItem>
        <DropdownMenuItem onClick={()=>setIsOpenPlaylistAddModal(true)}>
          <ListPlusIcon className="mr-2 size-4"/>
          Add to playlist
        </DropdownMenuItem>
        {onRemove&&(
        <DropdownMenuItem onClick={onRemove}>
          <Trash2Icon className="mr-2 size-4"/>
          Remove
        </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
    </>
  )
}
```

## Create description

### src/modules/videos/ui/components/video-top-row.tsx

```tsx
import { VideoGetOneOutput } from "../../types";
import { VideoMenu } from "./video-menu";
import { VideoOwner } from "./video-owner";
import { VideoReactions } from "./video-reactions";

interface VideoTopRowProps{
  video:VideoGetOneOutput;
};

export const VideoTopRow=({video}:VideoTopRowProps)=>{
  const utils=trpc.useUtils();
    const router=useRouter();
    const deleteVideo=trpc.videos.remove.useMutation({
      onSuccess:()=>{
        utils.videos.getOne.invalidate({id:video.id});
        utils.videos.getMany.invalidate();
        toast.success("Video has been successfully deleted")
        router.push('/');
      },
      onError:(error)=>{
         toast.error("Something went wrong") 
      }
    })
    const handleRemove=()=>{
      deleteVideo.mutate({id:video.id})
    }
     const compactViews=useMemo(()=>{
    return Intl.NumberFormat("en",{
      notation:"compact"
    }).format(1000)
  },[])；
  const expandedViews=useMemo(()=>{
    return Intl.NumberFormat("en",{
      notation:"standard"
    })
  },[]).format(1908764);
  const compactDate=useMemo(()=>{
    return formatDistanceToNow(video.createdAt,{addSuffix:true})
  },[video.createdAt]);
  const expandedDate=useMemo(()=>{
    return format(video.createdAt,"d MMM yyyy")},
    [video.createdAt]
    );
  return(
    <div className="flex flex-col gap-4 mt-4">
      <h1 className="text-xl font-semibold">{video.title}</h1>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <VideoOwner user={video.user} videoId={video.id}/>
        <div className="flex overflow-x-auto sm:min-w-[calc(50%-6px)] sm:justify-end sm:overflow-visible pb-2 -mb-2 sm:pb-0 sm:mb-0 gap-2">
          <VideoReactions/>
          <VideoMenu videoId={video.id} variant="secondary" onRemove={handleRemove}/>
        </div>
      </div>
      <VideoDescription
        compactViews={compactViews}
        expandedViews={expandedViews}
        compactDate={compactDate}
        expandedDate={expandedDate}
        description={video.description}
      />
    </div>
  )
}
```

### create src/modules/videos/ui/components/video-description.tsx

```tsx
import { cn } from "@/lib/utils";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { useState } from "react";

interface VideoDescriptionProps{
  compactViews:string;
  expandedViews:string;
  compactDate:string;
  expandedDate:string;
  description?:string| null;
}

export const VideoDescription=({
  compactViews,
  expandedViews,
  compactDate,
  expandedDate,
  description,
}:VideoDescriptionProps)=>{
  const [isExpanded,setIsExpanded]=useState(false);
  return(
  <div 
  onClick={()=>setIsExpanded((current)=> !current)}
  className="bg-secondary/50 rounded-xl p-3 cursor-pointer hover:bg-secondary/70 transition"
  >
    <div className="flex gap-2 text-sm mb-2">
      <span className="font-medium">
        {isExpanded ? expandedViews : compactViews} views
      </span>
      <span className="font-medium">
        {isExpanded ? expandedDate : compactDate} 
      </span>
    </div>
    <div className="relative">
      <p
      className={cn(
        "text-sm whitespace-pre-wrap",
        !isExpanded && "line-clamp-2",
      )}
      >
        {description||"No description"}
      </p>
      <div className="flex items-center gap-1 mt-4 text-sm font-medium">
        {isExpanded ? (
          <>
          Show less <ChevronUpIcon className="size-4"/>
          </>
        ):(
          <>
          Show more <ChevronDownIcon className="size-4"/>
          </>
        )}
      </div>
    </div>
  </div>
  )
}
```

## create comments and suggestion part

### src/modules/videos/ui/views/video-views.tsx

```tsx
import { CommentsSection } from "../sections/comments-section";
import { SuggestionsSection } from "../sections/suggestions-section";
import { VideoSection } from "../sections/video-section";

interface VideoViewProps{
  videoId:string;
}
export const VideoView=({videoId}:VideoViewProps)=>{
  return(
    <div className="flex flex-col max-w-[1700px] mx-auto pt-2.5 px-4 mb-10">
      <div className="flex flex-col xl:flex-row gap-6">
        {/* min-w-0：设置元素的最小宽度（min-width）为 0 */}
        <div className="flex-1 min-w-0">
          <VideoSection videoId={videoId}/>
          <div className="lg:hidden block mt-4">
            <SuggestionsSection/>
          </div>
          <CommentsSection/>
        </div>
        <div className="hidden lg:block w-full xl:w-[380px] 2xl:w-[460px] shrink-1">
          <SuggestionsSection/>
        </div>
      </div>
    </div>
  )
  
}
```

### create src/modules/videos/ui/sections/suggestions-section.tsx

```tsx
export const SuggestionsSection=()=>{
  return(
  <div>
    Suggestions
  </div>
  )
}
```

### create src/modules/videos/ui/sections/comments-section.tsx

```tsx
export const CommentsSection=()=>{
return(
<div>
  Comments
</div>
  )
}
```

# Chapter 18 Video views

## Requirements

After  a user watched a video, this video's view count will plus 1,and only 1,it means that no matter how many times a user watched this video ,it will finally couts 1.

## Workflow

![image-20250725190138186](/Users/a1/Library/Application Support/typora-user-images/image-20250725190138186.png)

## src/db/schema.ts

```ts
export const userRelations=relations(users,({many})=>({
  videos:many(videos),
  videoViews:many(videoViews),
}))

export const videoRelations=relations(videos,({one,many})=>({
  user:one(users,{
    fields:[videos.userId],
    references:[users.id]
  }),
  category:one(categories,{
    fields:[videos.categoryId],
    references:[categories.id]
  }),
  views:many(videoViews),
}))

export const videoViews=pgTable("video-views",{
   userId:uuid("user_id").references(()=>users.id,{onDelete:"cascade"}).notNull(),
   videoId:uuid("video_id").references(()=>videos.id,{onDelete:"cascade"}).notNull(),
   createdAt:timestamp("created_at").defaultNow().notNull(),
   updatedAt:timestamp("updated_at").defaultNow().notNull(),
  },(t)=>[
    primaryKey({
      name:"video_views_pk",
      columns:[t.userId,t.videoId],
    }),
  ]
   )

export const videoViewRelations=relations(videoViews,({one})=>({
    users:one(users,{
      fields:[videoViews.userId],
      references:[users.id]
    }),
    videos:one(videos,{
      fields:[videoViews.videoId],
      references:[videos.id]
    }),
  }))

 	export const videoViewSelectSchema=createSelectSchema(videoViews);
  export const videoViewInsertSchema=createInsertSchema(videoViews);
  export const videoViewUpdateSchema=createUpdateSchema(videoViews);
```

## Create src/modules/video-views/server/procedures.tsx

```tsx
import { db } from "@/db";
import { videoViews } from "@/db/schema";
import {createTRPCRouter,protectedProcedure} from "@/trpc/init";
import { and,eq } from "drizzle-orm";
import { z } from "zod";

export const videoViewsRouter=createTRPCRouter({
  create:protectedProcedure
    .input(z.object({videoId:z.string().uuid()}))
    .mutation(async({input,ctx})=>{
      const {videoId}=input;
      const {id:userId}=ctx.user;
      // The way of tracking views is going to be only for logged in users and only one view per user
      const [existingVideoView]=await  db
        .select()
        .from(videoViews)
        .where(
          and(
            eq(videoViews.videoId,videoId),
            eq(videoViews.userId,userId),
          )
        );
        //in there, we don't throw an error,cuz the TRPC will still trigger our refetch on react query.so what we have to do is find a way to block that on the front end part
        if(existingVideoView){
          return existingVideoView;
        }
        const [createVideoView]= await db
           .insert(videoViews)
           .values({userId,videoId}) 
           .returning()
        return createVideoView;
    }),  
})
```

## src/trpc/routers/_app.ts

```ts
import { categoriesRouter } from '@/modules/categories/server/procedures';
import {createTRPCRouter } from '../init';
import { studioRouter } from '@/modules/studio/server/procedures';
import { videosRouter } from '@/modules/videos /server/procedures';
import { videoViewsRouter } from '@/modules/video-views/server/procedure';
export const appRouter = createTRPCRouter({
   categories:categoriesRouter, 
   studio:studioRouter,
   videos:videosRouter,
   videoViews:videoViewsRouter,

});
// export type definition of API
export type AppRouter = typeof appRouter;
```

I wnat somehow query the views for this videos,so bascially I have to count this new table(videoViews) using this videoId

## src/modules/videos/server/procedures.ts

```ts
  export const videosRouter=createTRPCRouter({ 
    getOne:baseProcedure
        .input(z.object({id:z.string().uuid()}))
        .query(async ({input})=>{
          const [existingVideo]=await db
            .select({
              ...getTableColumns(videos),
              user:{
                ...getTableColumns(users),
              }, 
              //这是 Drizzle ORM 中的一个快捷统计方法，用于统计符合条件的行数。
              viewCount: db.$count(videoViews,eq(videoViews.videoId,videos.id))
            })
```

render the count in video-top-row.tsx

## src/modules/videos/ui/components/video-top-row.tsx

```tsx
export const VideoTopRow=({video}:VideoTopRowProps)=>{
  const compactViews=useMemo(()=>{
    return Intl.NumberFormat("en",{
      notation:"compact"
    }).format(video.viewCount)
  },[video.viewCount]);
  const expandedViews=useMemo(()=>{
    return Intl.NumberFormat("en",{
      notation:"standard"
    }).format(video.viewCount)
  },[video.viewCount]);
  const compactDate=useMemo(()=>{
```

now we have to find a way so that the video is played that we update it

## src/modules/videos/ui/sections/video-section.tsx

```tsx
const VideoSectionSuspense=({videoId}:VideoSectionProps)=>{
  const utils=trpc.useUtils();
  const {isSignedIn}=useAuth();
  const [video]=trpc.videos.getOne.useSuspenseQuery({id:videoId});
  const createView=trpc.videoViews.create.useMutation({
    onSuccess:()=>{
      //invalidate tells React Query to refetch this video's data (e.g., view count) because it's now outdated.
      utils.videos.getOne.invalidate({id:videoId})
    },

  }
  );
  const handlePlay=()=>{
    if(!isSignedIn) return;
    //如果用户已登录，就调用 createView.mutate()，向后端发送该视频的“观看记录”。
    //这里的 mutate() 通常来自 React Query 或 tRPC 的 mutation，用于执行数据更新操作（如新增记录）。
    createView.mutate({videoId});
  }
  
  return(
    <>
    {/* aspect-video：宽高比为视频比例（通常16:9） 
      video.muxStatus !== "ready"：如果视频还没准备好（可能还在上传或处理中）
      && "rounded-b-none"：那就把底部的圆角去掉
    */}
    <div className={cn(
      "aspect-video bg-black rounded-xl overflow-hidden relative",
       video.muxStatus !=="ready" && "rounded-b-none"
    )}>
      <VideoPlayer
      autoPlay
      onPlay={handlePlay}
      playbackId={video.muxPlaybackId}
      thumbnailUrl={video.thumbnailUrl}
      />
```

# Chapter 19 Video Reactions(like or dislike)

## Requirements

when click the like button and dislike button , the related number will be changed,and the icon will also change

when click the like or dislike button again,it will cancel the action before

And when I clicked the like button ,then click the dislike button, it will update the state

## Workflow

![image-20250725230321893](/Users/a1/Library/Application Support/typora-user-images/image-20250725230321893.png)

![image-20250725231852275](/Users/a1/Library/Application Support/typora-user-images/image-20250725231852275.png)

![image-20250725231902337](/Users/a1/Library/Application Support/typora-user-images/image-20250725231902337.png)

![image-20250725231913357](/Users/a1/Library/Application Support/typora-user-images/image-20250725231913357.png)

![image-20250725231924116](/Users/a1/Library/Application Support/typora-user-images/image-20250725231924116.png)

![image-20250725232633799](/Users/a1/Library/Application Support/typora-user-images/image-20250725232633799.png)

![image-20250725232730994](/Users/a1/Library/Application Support/typora-user-images/image-20250725232730994.png)

![image-20250725232739234](/Users/a1/Library/Application Support/typora-user-images/image-20250725232739234.png)

## src/db/schema.ts

```ts
 export const videoRelations=relations(videos,({one,many})=>({
  user:one(users,{
    fields:[videos.userId],
    references:[users.id]
  }),
  category:one(categories,{
    fields:[videos.categoryId],
    references:[categories.id]
  }),
  views:many(videoViews),
  reactions:many(videoReactions)
}))

export const userRelations=relations(users,({many})=>({
  videos:many(videos),
  videoViews:many(videoViews),
  videoReactions:many(videoReactions),
}))


/* reactionType：这是常量的名称，你可以通过它引用该常量。
    pgEnum：这个函数可能是一个用来定义 PostgreSQL 枚举类型的自定义函数。它接受两个参数：
    第一个参数 "reaction_type" 是枚举的名称，表示在数据库中你可能有一个叫做 reaction_type 的枚举字段。
    第二个参数 ["like", "dislike"] 是枚举的可能值，即该字段只能是 "like" 或 "dislike"，这通常用于表示某种用户反应或状态。
    */
  export const reactionType=pgEnum("reaction_type",["like","dislike"]);
  export const videoReactions=pgTable("video-reactions",{
    userId:uuid("user_id").references(()=>users.id,{onDelete:"cascade"}).notNull(),
    videoId:uuid("video_id").references(()=>videos.id,{onDelete:"cascade"}).notNull(),
    type:reactionType("type").notNull(),
    createdAt:timestamp("created_at").defaultNow().notNull(),
    updatedAt:timestamp("updated_at").defaultNow().notNull(),
   },(t)=>[
     primaryKey({
       name:"video_reactions_pk",
       columns:[t.userId,t.videoId],
     }),
   ]);

   export const videoReactionRelations=relations(videoReactions,({one})=>({
    users:one(users,{
      fields:[videoReactions.userId],
      references:[users.id]
    }),
    videos:one(videos,{
      fields:[videoReactions.videoId], 
      references:[videos.id]
    }),
  }));
  //zod验证从数据库中读取出/新增/更新的数据结构是否正确。
  export const videoReactionSelectSchema=createSelectSchema(videoReactions);
  export const videoReactionInsertSchema=createInsertSchema(videoReactions);
  export const videoReactionUpdateSchema=createUpdateSchema(videoReactions);
```

## src/modules/videos/server/procedures.ts

//to add how many likes this video has received

```ts
//create new videos
  export const videosRouter=createTRPCRouter({ 
    getOne:baseProcedure
        .input(z.object({id:z.string().uuid()}))
        .query(async ({input,ctx})=>{
          //从请求上下文（ctx）中取出来的，是当前登录用户的 ID。通过它查数据库得到当前登录用户的 userId，用于查询他对视频的行为（点赞、点踩等）
          const {clerkUserId}=ctx;
          let userId;
          const [user]=await db
                .select()
                .from(users) 
                //这里使用 inArray，是因为 这个查询条件要么是一个包含一个元素的数组，要么是空数组，而 inArray 支持传入任意长度的数组。
                .where(inArray(users.clerkId,clerkUserId ? [clerkUserId]:[])) 
          //If user is found, store the user ID.      
          if(user){
            userId=user.id;
          }  


          /* This creates a temporary CTE（公用表表达式） (viewer_reactions) that includes only the current user’s reactions to videos, so it can be joined later. */
          //解决什么问题？在单个查询中同时获取视频列表和当前用户对每个视频的反应
          const viewerReactions=db.$with("viewer_reactions").as(
            db
              .select({
                videoId:videoReactions.videoId,
                type:videoReactions.type,
              })
              .from(videoReactions)
              .where(inArray(videoReactions.userId,userId ? [userId]:[]))
          );

          const [existingVideo]=await db
          /* if you want to do an Join-something on that table,you have to add with in the beginning here */
            .with(viewerReactions)
            .select({
              ...getTableColumns(videos),
              user:{
                ...getTableColumns(users),
              },
              /* 
              计算该视频的：
              播放次数（viewCount）
              点赞数（likeCount）
              点踩数（dislikeCount） 
              */
              //这是 Drizzle ORM 中的一个快捷统计方法，用于统计符合条件的行数。
              viewCount: db.$count(videoViews,eq(videoViews.videoId,videos.id)),
              likeCount:db.$count(
                videoReactions,
                and(
                  eq(videoReactions.videoId,videos.id),
                  eq(videoReactions.type,"like"),
                )),
              dislikeCount:db.$count(
                videoReactions,
                and(
                  eq(videoReactions.videoId,videos.id),
                  eq(videoReactions.type,"dislike"),
                )),
              viewReactions:viewerReactions.type,  
            })
            .from(videos)
            //这句是在查询视频时，连表查出视频上传者的用户信息，跟 clerkUserId 没关系。
            .innerJoin(users,eq(users.id,videos.userId))
            //当前用户是否对该视频有 reaction（left join viewerReactions）
            .leftJoin(viewerReactions,eq(viewerReactions.videoId,videos.id))
            .where(eq(videos.id,input.id))
            if(!existingVideo){
              throw new TRPCError({code:"NOT_FOUND"})
            }
            return existingVideo;
        }),
```

## createsrc/modules/video-reaction/server/procedure.ts

```ts
import { db } from "@/db";
import { videoReactions } from "@/db/schema";
import {createTRPCRouter,protectedProcedure} from "@/trpc/init";
import { and,eq } from "drizzle-orm";
import { z } from "zod";

export const videoReactionsRouter=createTRPCRouter({
  like:protectedProcedure
    .input(z.object({videoId:z.string().uuid()}))
    .mutation(async({input,ctx})=>{
      const {videoId}=input;
      const {id:userId}=ctx.user;
      // The way of tracking views is going to be only for logged in users and only one view per user
      const [existingVideoReactionLike]=await  db
        .select()
        .from(videoReactions)
        .where(
          and(
            eq(videoReactions.videoId,videoId),
            eq(videoReactions.userId,userId),
            eq(videoReactions.type,"like")
          )
        );
        //removing our like
        if(existingVideoReactionLike){
          const [deletedViewerReaction]=await db
             .delete(videoReactions)
             .where(
              and(
                eq(videoReactions.userId,userId),
                eq(videoReactions.videoId,videoId),
              )
             ) 
             .returning();
             return deletedViewerReaction;
        }
        const [createVideoReaction]= await db
           .insert(videoReactions)
           .values({userId,videoId,type:"like"}) 
           //当我们之前已经点击过dislike时，会发生冲突，所以会重新设置为like
           .onConflictDoUpdate({
            target:[videoReactions.userId,videoReactions.videoId],
            set:{
              type:"like",
            },
           })
           .returning()
        return createVideoReaction;
    }),  
    dislike:protectedProcedure
    .input(z.object({videoId:z.string().uuid()}))
    .mutation(async({input,ctx})=>{
      const {videoId}=input;
      const {id:userId}=ctx.user;
      // The way of tracking views is going to be only for logged in users and only one view per user
      const [existingVideoReactionDislike]=await  db
        .select()
        .from(videoReactions)
        .where(
          and(
            eq(videoReactions.videoId,videoId),
            eq(videoReactions.userId,userId),
            eq(videoReactions.type,"dislike")
          )
        );
        //removing our like
        if(existingVideoReactionDislike){
          const [deletedViewerReaction]=await db
             .delete(videoReactions)
             .where(
              and(
                eq(videoReactions.userId,userId),
                eq(videoReactions.videoId,videoId),
              )
             ) 
             .returning();
             return deletedViewerReaction;
        }
        const [createVideoReaction]= await db
           .insert(videoReactions)
           .values({userId,videoId,type:"dislike"}) 
           .onConflictDoUpdate({
            target:[videoReactions.userId,videoReactions.videoId],
            set:{
              type:"dislike",
            },
           })
           .returning()
        return createVideoReaction;
    }), 
})

```

## src/modules/videos/ui/components/video-top-row.tsx

```tsx
 <VideoReactions
          videoId={video.id}
          likes={video.likeCount}
          dislikes={video.dislikeCount}
          viewerReaction={video.viewReactions}
          />
```

## src/trpc/routers/_app.ts

```ts
import { categoriesRouter } from '@/modules/categories/server/procedures';
import {createTRPCRouter } from '../init';
import { studioRouter } from '@/modules/studio/server/procedures';
import { videosRouter } from '@/modules/videos /server/procedures';
import { videoViewsRouter } from '@/modules/video-views/server/procedure';
import { videoReactionsRouter } from '@/modules/video-reactions/server/procedure';
export const appRouter = createTRPCRouter({
   categories:categoriesRouter, 
   studio:studioRouter,
   videos:videosRouter,
   videoViews:videoViewsRouter,
   videoReactions:videoReactionsRouter,

});
// export type definition of API
export type AppRouter = typeof appRouter;
```

## src/modules/videos/ui/components/video-rections.tsx

```tsx
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { ThumbsDownIcon, ThumbsUpIcon } from 'lucide-react';
import React from 'react';
import { VideoGetOneOutput } from '../../types';
import { useClerk } from '@clerk/nextjs';
import { trpc } from '@/trpc/client';
import { toast } from 'sonner';

interface VideoReactionsProps{
  videoId:string;
  likes:number;
  dislikes:number;
  viewerReaction:VideoGetOneOutput["viewReactions"];
}


//TODO:properly implement viewer reactions
export const VideoReactions = ({
  videoId,
  likes,
  dislikes,
  viewerReaction,
}:VideoReactionsProps) => {
  const clerk=useClerk();
  const utils=trpc.useUtils();
  const like=trpc.videoReactions.like.useMutation({
    onSuccess:()=>{
      utils.videos.getOne.invalidate({id:videoId})
      //TODO:Invalidate "liked" playlist
    },
    onError:(error)=>{
      toast.error("Something went wrong");
      if(error.data?.code==="UNAUTHORIZED"){
        clerk.openSignIn();
      }
    }
  }
  );
  const dislike=trpc.videoReactions.dislike.useMutation(
    {
      onSuccess:()=>{
        utils.videos.getOne.invalidate({id:videoId})
        //TODO:Invalidate "liked" playlist
      },
      onError:(error)=>{
        toast.error("Something went wrong");
        if(error.data?.code==="UNAUTHORIZED"){
          clerk.openSignIn();
        }
      }
    }
  );
  return (
    //flex-none 表示这个元素 在 flex 布局中不允许伸缩，也不会自动缩放大小，它的尺寸完全由 width / height 或内容大小决定。
    <div className="flex items-center flex-none">
      <Button
        onClick={()=>like.mutate({videoId})}
        disabled={like.isPending||dislike.isPending}
        variant="secondary"
        className="rounded-l-full rounded-r-none gap-2 pr-4"
      >
      <ThumbsUpIcon className={cn("size-5",viewerReaction==="like" && "fill-black")}/>
      {likes}
      </Button>
      {/* <Separator orientation="vertical" /> 是一个垂直分隔线组件，常用于并排布局中，将两个区域视觉上分开。 */}
      <Separator orientation='vertical' className="h-7"/>
      <Button
        onClick={()=>dislike.mutate({videoId})}
        disabled={like.isPending||dislike.isPending}
        variant="secondary"
        className="rounded-l-none rounded-r-full pl-3"
      >
      <ThumbsDownIcon className={cn("size-5",viewerReaction ==="dislike" && "fill-black")}/>
      {dislikes}
      </Button>
    </div>
  )
}

```

# Chapter 20 Subscriptions

## Requirements

If viewer user is not the creator user, it will display the subscribe button ,or edit video button

After click the subscribe button,this data will be insert into the schema(and the style will be changed), click again ,cancel this record(and the style will be changed)

## Workflow

![image-20250725231331074](/Users/a1/Library/Application Support/typora-user-images/image-20250725231331074.png)

![image-20250725231340988](/Users/a1/Library/Application Support/typora-user-images/image-20250725231340988.png)

![image-20250725231449805](/Users/a1/Library/Application Support/typora-user-images/image-20250725231449805.png)

![image-20250725231502634](/Users/a1/Library/Application Support/typora-user-images/image-20250725231502634.png)

![image-20250725231512763](/Users/a1/Library/Application Support/typora-user-images/image-20250725231512763.png)

![image-20250725231818775](/Users/a1/Library/Application Support/typora-user-images/image-20250725231818775.png)

## Create subscriptions schema

### src/db/schema.ts

```ts
export const userRelations=relations(users,({many})=>({
  videos:many(videos),
  videoViews:many(videoViews),
  videoReactions:many(videoReactions),
  subscriptions:many(subscriptions,{
    relationName:"subscriptions_viewer_id_fkey"
  }),
  subscribers:many(subscriptions,{
    relationName:"subscriptions_creator_id_fKey"
  }),
}))


export const subscriptions=pgTable("subscriptions",{
  viewerId:uuid("viewer_id").references(()=>users.id,{onDelete:"cascade"}).notNull(),
  creatorId:uuid("creator_id").references(()=>users.id,{onDelete:"cascade"}).notNull(),
  createdAt:timestamp("created_at").defaultNow().notNull(),
  updatedAt:timestamp("updated_at").defaultNow().notNull(),
},(t)=>[
  primaryKey({
    name:"subscriptions_pk",
    columns:[t.viewerId,t.creatorId]
  })
])

export const subscriptionRelations=relations(subscriptions,({one})=>({
  viewerId:one(users,{
    fields:[subscriptions.viewerId],
    references:[users.id],
    relationName:"subscriptions_viewer_id_fkey"
  }),
  creatorId:one(users,{
    fields:[subscriptions.creatorId],
    references:[users.id],
    relationName:"subscriptions_creator_id_fKey"
  })
}))
```

## combine subscriptions for "getOne" videos procedure

### create src/modules/subscriptions/server/procedures.ts

```ts
import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import {createTRPCRouter,protectedProcedure} from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { and,eq } from "drizzle-orm";
import { z } from "zod";

export const subscriptionsRouter=createTRPCRouter({
  create:protectedProcedure
    .input(z.object({userId:z.string().uuid()}))
    .mutation(async({input,ctx})=>{
      const {userId}=input;
      if(userId===ctx.user.id){
        throw new TRPCError({code:"BAD_REQUEST"})
      }
      const [createdSubscription]=await db
        .insert(subscriptions)
        .values({viewerId:ctx.user.id,creatorId:userId})
        .returning();
        return createdSubscription;
    }),
    remove:protectedProcedure
    .input(z.object({userId:z.string().uuid()}))
    .mutation(async({input,ctx})=>{
      const {userId}=input;
      if(userId===ctx.user.id){
        throw new TRPCError({code:"BAD_REQUEST"})
      }
      const [deletedSubscription]=await db
        .delete(subscriptions)
        .where(
          and(
            eq(subscriptions.viewerId,ctx.user.id),
            eq(subscriptions.creatorId,userId)
          )
        )
        .returning();
        return deletedSubscription;
    }),  
  })
```

### src/trpc/routers/_app.ts

```ts
import { categoriesRouter } from '@/modules/categories/server/procedures';
import {createTRPCRouter } from '../init';
import { studioRouter } from '@/modules/studio/server/procedures';
import { videosRouter } from '@/modules/videos /server/procedures';
import { videoViewsRouter } from '@/modules/video-views/server/procedure';
import { videoReactionsRouter } from '@/modules/video-reactions/server/procedure';
import { subscriptionsRouter } from '@/modules/subscriptions/server/procedures';
export const appRouter = createTRPCRouter({
   categories:categoriesRouter, 
   studio:studioRouter,
   videos:videosRouter,
   videoViews:videoViewsRouter,
   videoReactions:videoReactionsRouter,
   subscriptions:subscriptionsRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;
```

We need information on whether we are subscribed to the author of this video or not ,which means we have to revisit our 

### modules/videos/server/procedures.ts

getOne procedure:

```ts
const viewerSubscriptions=db.$with("viewer_subscriptions").as(
            db
              .select()
              .from(subscriptions)
              .where(inArray(subscriptions.viewerId,userId ? [userId]:[]))
           )
           
 const [existingVideo]=await db
           /* if you want to do an Join-something on that table,you have to add with in the beginning here */
            .with(viewerReactions,viewerSubscriptions)  
            .select({
              ...getTableColumns(videos),
              user:{
                ...getTableColumns(users),
                subscriberCount:db.$count(subscriptions,eq(subscriptions.creatorId,users.id)),
                /* isNotNull(viewerSubscriptions.viewerId)
                  判断 viewerSubscriptions.viewerId 是否不为 null，返回一个布尔值或布尔包装对象。
                  → 结果是 true 或 false。 */
                viewerSubscribed:isNotNull(viewerSubscriptions.viewerId).mapWith(Boolean),
              },
              
              
   .from(videos)
            //这句是在查询视频时，连表查出视频上传者的用户信息，跟 clerkUserId 没关系。
            .innerJoin(users,eq(users.id,videos.userId))
            //当前用户是否对该视频有 reaction（left join viewerReactions）
            .leftJoin(viewerReactions,eq(viewerReactions.videoId,videos.id))
            .leftJoin(viewerSubscriptions,eq(viewerSubscriptions.creatorId,users.id))
            .where(eq(videos.id,input.id))         
```

### create a common hook

because we will be able to subscribe the user from many different places

#### create src/modules/subscriptions/hooks/use-subscription.ts

```ts
import {toast} from 'sonner';
import {useClerk} from "@clerk/nextjs";
import {trpc} from "@/trpc/client";

interface UseSubscriptionProps{
  userId:string;
  isSubscribed:boolean;
  fromVideoId?:string;
}

export const UseSubscription=({
  userId,
  isSubscribed,
  fromVideoId,
}:UseSubscriptionProps)=>{
  const clerk=useClerk();
  const utils=trpc.useUtils();
  const subscribe=trpc.subscriptions.create.useMutation({
    onSuccess:()=>{
      toast.success("Subscribed");
      //TODO:reinvalidate subscriptions.getMany ,users.getOne
      if(fromVideoId){
         utils.videos.getOne.invalidate({id:fromVideoId}) 
      }
    },
    onError:(error)=>{
      toast.error("Something went wrong");
      if(error.data?.code==="UNAUTHORIZED"){
        clerk.openSignIn();
      }
    }
  }
   
  );
  const unsubscribe=trpc.subscriptions.remove.useMutation({
    onSuccess:()=>{
      toast.success("unsubscribed");
      //TODO:reinvalidate subscriptions.getMany ,users.getOne
      if(fromVideoId){
         utils.videos.getOne.invalidate({id:fromVideoId}) 
      }
    },
    onError:(error)=>{
      toast.error("Something went wrong");
      if(error.data?.code==="UNAUTHORIZED"){
        clerk.openSignIn();
      }
    }
  }
    
  );
  const isPending=subscribe.isPending ||unsubscribe.isPending;
  const onClick=()=>{
    if(isSubscribed){
      unsubscribe.mutate({userId})
    }else{
      subscribe.mutate({userId})
    }
  };
  return {
    isPending,
    onClick,
  }
}

```

#### src/modules/videos/ui/components/video-owner.tsx

```tsx
import Link from "next/link";
import { VideoGetOneOutput } from "../../types";
import { UserAvatar } from "@/components/user-avatar";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { SubscriptionButton } from "@/modules/subscriptions/ui/components/subscription-button";
import { UserInfo } from "@/modules/users/ui/components/user-info";
import { UseSubscription } from "@/modules/subscriptions/hooks/use-subscription";

interface VideoOwnerProps{
  user:VideoGetOneOutput["user"],
  videoId:string;
};

export const VideoOwner=({user,videoId}:VideoOwnerProps)=>{
  const {userId:clerkUserId,isLoaded}=useAuth();
  const {isPending,onClick}=UseSubscription({
    userId:user.id,
    isSubscribed:user.viewerSubscribed,
    fromVideoId:videoId,
  })
  return(
    <div className="flex items-center sm:items-start  justify-between sm:justify-start gap-3 min-w-0">
      <Link href={`/users/${user.id}`}>
        <div className="flex items-center gap-3 min-w-0">
          <UserAvatar size="lg" imageUrl={user.imageUrl} name={user.name}/>
          <div className="flex flex-col gap-1 min-w-0">
            <UserInfo
            size="lg"
            name={user.name}
            />
            <span className="text-sm text-muted-foreground line-clamp-1 ">
              {/* TODO:properly fill subscriber count */}
              {user.subscriberCount} subscribers
            </span>
            </div>
        </div>
      </Link>
      {clerkUserId===user.clerkId ? (
        <Button
        variant="secondary"
        className="rounded-full"
        asChild
        >
          <Link href={`/studio/videos/${videoId}`}>
            Edit video
          </Link>
        </Button>
      ): (
        <SubscriptionButton
          onClick={onClick}
          disabled={isPending || !isLoaded}
          isSubscribed={user.viewerSubscribed}
          className="flex-none"
        />
      )} 
    </div>
  )}
```

#### src/modules/videos/ui/components/video-top-row.tsx

```tsx
 <VideoOwner user={video.user} videoId={video.id}/>
```

# Chapter 21 Comments

## Requirements

When type the comments and click the comment button,the contents of this comment will display below immediately

## Workflow

![image-20250727144504569](/Users/a1/Library/Application Support/typora-user-images/image-20250727144504569.png)

## create VideoTopRow Skelton

### src/modules/videos/ui/components/video-top-row.tsx

```tsx
export const VideoTopRowSkelton=()=>{
  return(
    <div className="flex flex-col gap-4 mt-4">
      <div className="flex flex-col gap-2"> 
        <Skeleton className="h-6 w-4/5 md:w-2/5"/>
      </div>
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-3 w-[70%]">
        <Skeleton className="w-10 h-10 rounded-full shrink-0"/>
        <div className="flex flex-col gap-2 w-full">
        <Skeleton className="h-5 w-4/5 md:w-2/6"/>
        <Skeleton className="h-5 w-3/5 md:w-1/5"/>
      </div>
      </div>
        <Skeleton className="h-9 w-2/6 md:1/6 rounded-full"/>
      </div>  
      <div className="h-[120px] w-full"/>
    </div>
  );
}
```

## create VideoPlayer Skeleton

### src/modules/videos/ui/components/video-player.tsx

```tsx
export const VideoPlayerSkeleton=()=>{
  return <div className="aspect-video bg-black rounded-xl"/>
}
```

## create VideoSectionSkeleton

### src/modules/videos/ui/sections/video-section.tsx

```tsx
export const VideoSection=({videoId}:VideoSectionProps)=>{
  return(
    <Suspense fallback={<VideoSectionSkeleton/>}>
      <ErrorBoundary fallback={<p>Error</p>}>
        <VideoSectionSuspense videoId={videoId}/>
      </ErrorBoundary>
    </Suspense>
  )
}

const VideoSectionSkeleton=()=>{
  return (
    <>
    <VideoPlayerSkeleton/>
    <VideoTopRowSkelton/>
    </>
  )
}
```

## change viewerId/creatorId to viewer and creator

### src/db/schema.ts

```ts
export const subscriptionRelations=relations(subscriptions,({one})=>({
  viewer:one(users,{
    fields:[subscriptions.viewerId],
    references:[users.id],
    relationName:"subscriptions_viewer_id_fkey"
  }),
  creator:one(users,{
    fields:[subscriptions.creatorId],
    references:[users.id],
    relationName:"subscriptions_creator_id_fKey"
  })
}))
```

## create comments schema

### src/db/schema.ts

```ts
export const userRelations=relations(users,({many})=>({
  videos:many(videos),
  videoViews:many(videoViews),
  videoReactions:many(videoReactions),
  subscriptions:many(subscriptions,{
    relationName:"subscriptions_viewer_id_fkey"
  }),
  subscribers:many(subscriptions,{
    relationName:"subscriptions_creator_id_fKey"
  }),
  comments:many(comments),
}))

export const videoRelations=relations(videos,({one,many})=>({
  user:one(users,{
    fields:[videos.userId],
    references:[users.id]
  }),
  category:one(categories,{
    fields:[videos.categoryId],
    references:[categories.id]
  }),
  views:many(videoViews),
  reactions:many(videoReactions),
  comments:many(comments),
}))

export const comments=pgTable("comments",{
  id:uuid("id").primaryKey().defaultRandom(),
  userId:uuid("user_id").references(()=>users.id,{onDelete:"cascade"}).notNull(),
  videoId:uuid("video_id").references(()=>videos.id,{onDelete:"cascade"}).notNull(),
  value:text("value").notNull(),
  createdAt:timestamp("created_at").defaultNow().notNull(),
  updatedAt:timestamp("updated_at").defaultNow().notNull(),
})
export const commentRelations=relations(comments,({one})=>({
  user:one(users,{
    fields:[comments.userId],
    references:[users.id],
  }),
  video:one(videos,{
    fields:[comments.videoId],
    references:[videos.id],
  }),
}))
	//定义从数据库 查询评论数据 时的返回结构。
  export const commentSelectSchema=createSelectSchema(comments);
	//定义 创建新评论 时的数据验证规则。
  export const commentInsertSchema=createInsertSchema(comments);
	//定义 更新评论 时的数据验证规则。
  export const commentUpdateSchema=createUpdateSchema(comments);
```

## create src/modules/comments/server/procedure.ts

```ts
import { db } from "@/db";
import { commentInsertSchema, comments } from "@/db/schema";
import {baseProcedure, createTRPCRouter,protectedProcedure} from "@/trpc/init";
import { and,eq } from "drizzle-orm";
import { z } from "zod";

export const commentsRouter=createTRPCRouter({
  create:protectedProcedure
    .input(z.object({
      videoId:z.string().uuid(),
      value:z.string(),
    }))
    .mutation(async({input,ctx})=>{
      const {videoId,value}=input;
      const {id:userId}=ctx.user;
      const [createdComment]= await db
           .insert(comments)
      //谁评论了哪个视频,评论了什么内容
           .values({userId,videoId,value}) 
           .returning()
        return createdComment;
    }),  
  getMany:baseProcedure
      .input(
        z.object({
          videoId:z.string().uuid(),
        }),
      ) 
      .query(async({input})=>{
        const {videoId}=input;
        const data=await db
            .select()
            .from(comments)
            .where(eq(comments.videoId,videoId))
            return data;
      }), 
})
```

## src/trpc/routers/_app.ts

```ts
import { categoriesRouter } from '@/modules/categories/server/procedures';
import {createTRPCRouter } from '../init';
import { studioRouter } from '@/modules/studio/server/procedures';
import { videosRouter } from '@/modules/videos /server/procedures';
import { videoViewsRouter } from '@/modules/video-views/server/procedure';
import { videoReactionsRouter } from '@/modules/video-reactions/server/procedure';
import { subscriptionsRouter } from '@/modules/subscriptions/server/procedures';
import { commentsRouter } from '@/modules/comments/server/procedure';
export const appRouter = createTRPCRouter({
   categories:categoriesRouter, 
   studio:studioRouter,
   videos:videosRouter,
   comments:commentsRouter,
   videoViews:videoViewsRouter,
   videoReactions:videoReactionsRouter,
   subscriptions:subscriptionsRouter,

});
// export type definition of API
export type AppRouter = typeof appRouter;
```

## src/app/(home)/videos/[videoId]/page.tsx

```tsx
  //TODO don't forget to change 
  void trpc.comments.getMany.prefetch({videoId:videoId});
```

## src/modules/videos/ui/views/video-view.tsx

```tsx
import { CommentsSection } from "../sections/comments-section";
import { SuggestionsSection } from "../sections/suggestions-section";
import { VideoSection } from "../sections/video-section";

interface VideoViewProps{
  videoId:string;
}
export const VideoView=({videoId}:VideoViewProps)=>{
  return(
    <div className="flex flex-col max-w-[1700px] mx-auto pt-2.5 px-4 mb-10">
      <div className="flex flex-col xl:flex-row gap-6">
        {/* min-w-0：设置元素的最小宽度（min-width）为 0 */}
        <div className="flex-1 min-w-0">
          <VideoSection videoId={videoId}/>
          <div className="lg:hidden block mt-4">
            <SuggestionsSection/>
          </div>
          <CommentsSection videoId={videoId}/>
        </div>
        <div className="hidden lg:block w-full xl:w-[380px] 2xl:w-[460px] shrink-1">
          <SuggestionsSection/>
        </div>
      </div>
    </div>
  )
}
```

## src/modules/videos/ui/sections/comments-section.tsx

```tsx
"use client";

import { CommentForm } from "@/modules/comments/ui/components/comment-form";
import { trpc } from "@/trpc/client";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

interface CommentsSectionProps{
  videoId:string
}

export const CommentsSection=({videoId}:CommentsSectionProps)=>{
  return(
  <Suspense fallback={<p>Loading...</p>}>
    <ErrorBoundary fallback={<p>Error</p>}>
      <CommentsSectionSuspense videoId={videoId}/>
    </ErrorBoundary>
  </Suspense>
  )
}

export const CommentsSectionSuspense=({videoId}:CommentsSectionProps)=>{
  const [comments]=trpc.comments.getMany.useSuspenseQuery({videoId})
    return(
      <div className="mt-6">
        <div className="flex flex-col gap-6">
          <h1>
            0 comments
          </h1>
          <CommentForm videoId={videoId}/>
        </div>
      </div>
        )
}
```

## create src/modules/comments/ui/components/comment-form.tsx

```tsx
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/components/user-avatar";
import { useUser,useClerk } from "@clerk/nextjs";
import { z } from "zod";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { trpc } from "@/trpc/client";
import { commentInsertSchema } from "@/db/schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage
} from "@/components/ui/form";
interface CommentFormProps{
  videoId:string;
  onSuccess?:()=>void;
};

export const CommentForm=({
  videoId,
  onSuccess,
}:CommentFormProps)=>{
  const clerk=useClerk();
  const {user}=useUser();
  const utils=trpc.useUtils();
  const create=trpc.comments.create.useMutation({
    onSuccess:()=>{
      utils.comments.getMany.invalidate({videoId});
      form.reset();
      toast.success("Comment added")
      onSuccess?.();
    },
    onError:(error)=>{
      toast.error("Something went wrong");
      if(error.data?.code==="UNAUTHORIZED"){
        clerk.openSignIn();
      }
    }
  });
  //新生成的 formSchema 将不再包含 userId 字段
  //安全考虑：
		//避免让用户直接提交 userId（防止伪造他人身份）
		//通常在服务端从登录会话中自动获取用户ID
  const formSchema = commentInsertSchema.omit({ userId: true });
  const form=useForm<z.infer<typeof formSchema>>({
    //在前端表单中不需要用户输入 userId，所以排除掉userId字段
    resolver:zodResolver(formSchema),
    defaultValues:{
      videoId,
      value:"",
    },
  });
  const handleSubmit=(values:z.infer<typeof formSchema>)=>{
    create.mutate(values)
  }
  return(
    <Form {...form}>
    <form 
    onSubmit={form.handleSubmit(handleSubmit)}
    className="flex gap-4 group">
      <UserAvatar
      size="lg"
      imageUrl={user?.imageUrl || "/user-placeholder.svg"}
      name={user?.username || "User"}
      />
      {/*flex-1 用于在 Flexbox 布局中快速让某个元素自动撑满剩余空间。 */}
      <div className="flex-1 flex flex-col gap-2">
        <FormField
        name="value"
        control={form.control}
        render={({field})=>(
          <FormItem>
            <FormControl>
          <Textarea
          {...field}
          placeholder="Add a comment..."
          // 禁止用户调整大小（即不允许拖动 textarea 改变宽高）。
          className="resize-none bg-transparent overflow-hidden min-h-0"
          />
          </FormControl>
          <FormMessage/>
          </FormItem>
        )}
        />
       
      <div className="justify-end gap-2 flex">
        <Button
          disabled={create.isPending}
          type="submit"
          size="sm"
        >
          comment
        </Button>
      </div>
      </div>
    </form>
    </Form>
  )
}
```

## src/modules/videos/ui/sections/comments-section.tsx

```tsx
<div className="flex flex-col gap-4 mt-2">
              {comments.map((comment)=>{
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                  />
              })}
            </div>
```

## Create src/modules/comments/types.ts

```ts
import {inferRouterOutputs} from "@trpc/server";
import {AppRouter} from "@/trpc/routers/_app";

export type CommentsGetManyOutput=
//You're inferring(获取) the return type of the videos.getOne API route and naming it VideoGetOneOutput.
       inferRouterOutputs<AppRouter>["comments"]["getMany"];
```

## src/modules/comments/server/procedure.ts

```ts
getMany:baseProcedure
      .input(
        z.object({
          videoId:z.string().uuid(),
        }),
      ) 
      .query(async({input})=>{
        const {videoId}=input;
        const data=await db
            .select({
              //getTableColumns(comments) 会获取 comments 表中的所有字段（如 id、value、createdAt 等），避免你手动写出每一列。
              ...getTableColumns(comments),
              //user: users 表示要把 users 整张表的字段作为一个嵌套对象返回，并命名为 user（用于 inner join 的结果）。
              user:users
            })
            .from(comments)
            .where(eq(comments.videoId,videoId))
            //把 comments 表与 users 表做 内连接（inner join）。这样你就能拿到每条评论的同时，知道评论者的用户信息。
            .innerJoin(users,eq(comments.userId,users.id))
            return data;
      }), 
```

## create src/modules/comments/ui/components/comment-item.tsx

```tsx
import Link from "next/link";
import { CommentsGetManyOutput } from "../../types";
import { UserAvatar } from "@/components/user-avatar";
import { formatDistanceToNow } from "date-fns";

interface CommentItemProps{
  comment:CommentsGetManyOutput[number]
}

export const CommentItem=({
  comment,
}:CommentItemProps)=>{
  return (
    <div>
      <div className="flex gap-4">
        <Link href={`/users/${comment.userId}`}>
          <UserAvatar
            size="lg"
            imageUrl={comment.user.imageUrl}
            name={comment.user.name}
          />
        </Link>
        <div className="flex-1 min-w-0">
          <Link href={`/users/${comment.userId}`}>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-medium text-sm pb-0.5">
                {comment.user.name}
                </span>  
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(comment.createdAt,{
                  addSuffix:true,
                })}
                </span>  
            </div>
          </Link>
          <p className="text-sm">{comment.value}</p>
        </div>
      </div>
    </div>
  )
}
```

![image-20250519195616559](/Users/a1/Library/Application Support/typora-user-images/image-20250519195616559.png)

# Chapter 23 comments infinite loading

## Requirements

Add comment infinite scroll

display  the total comment counts of this video

add delete button and only the comment user have rights to delete 

## Workflow

![image-20250727161009860](/Users/a1/Library/Application Support/typora-user-images/image-20250727161009860.png)

## Modify comments "getMany"procedure

### src/modules/comments/server/procedure.ts

```ts
getMany:baseProcedure
      .input(
        z.object({
          videoId:z.string().uuid(),
          cursor:z.object({
            id:z.string().uuid(),
            updatedAt:z.date(),
          }).nullish(),
          limit:z.number().min(1).max(100),
        }),
      ) 
      .query(async({input})=>{
        const {cursor,limit}=input;
        const {videoId}=input;
        const data=await db
            .select({
              //getTableColumns(comments) 会获取 comments 表中的所有字段（如 id、value、createdAt 等），避免你手动写出每一列。
              ...getTableColumns(comments),
              //user: users 表示要把 users 整张表的字段作为一个嵌套对象返回，并命名为 user（用于 inner join 的结果）。
              user:users
            })
            .from(comments)
            .where(and(
              eq(comments.videoId,videoId),
              cursor
                ? or(
                  lt(comments.updatedAt,cursor.updatedAt),
                  and(
                    eq(comments.updatedAt,cursor.updatedAt),
                    lt(comments.id,cursor.id)
                  )
                )
                :undefined
              ))
            //把 comments 表与 users 表做 内连接（inner join）。这样你就能拿到每条评论的同时，知道评论者的用户信息。
            .innerJoin(users,eq(comments.userId,users.id))
            .orderBy(desc(comments.updatedAt),desc(comments.id))  
            .limit(limit+1)
            const hasMore=data.length >limit
            //remove the last item if there is more data
            const items=hasMore ?data.slice(0,-1):data
            //set the next cursor to the last item if there is more data
            const lastItem=items[items.length-1];
            const nextCursor=hasMore ?
              {
                id:lastItem.id,
                updatedAt:lastItem.updatedAt
              }:null;
            return {
              items,
              nextCursor,
            }
      }), 
})
```

## Change prefetch () to prefetchInfinite()

### src/app/(home)/videos/[videoId]/page.tsx

```tsx
void trpc.comments.getMany.prefetchInfinite({videoId,limit:DEFAULT_LIMIT});
```

## Change suspense() to useSuspenseInfiniteQuery()

### src/modules/videos/ui/sections/comment-section.tsx

```tsx
export const CommentsSectionSuspense=({videoId}:CommentsSectionProps)=>{
  const [comments,query]=trpc.comments.getMany.useSuspenseInfiniteQuery(
    {videoId,
    limit:DEFAULT_LIMIT},
    {
      getNextPageParam:(lastPage)=>lastPage.nextCursor,
    }
    )
    return(
      <div className="mt-6">
        <div className="flex flex-col gap-6">
          <h1>
            0 comments
          </h1>
          <CommentForm videoId={videoId}/>
          <div className="flex flex-col gap-4 mt-2">
              {comments.pages.flatMap((page)=>page.items).map((comment)=>{
                return(
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                  />
                )                  
              })}
              <InfiniteScroll
          		//不会在滚动到底部时自动加载下一页，而是需要用户点击“加载更多”按钮或其他交互手动触发加载。
              isManual  
              hasNextPage={query.hasNextPage}
              isFetchingNextPage={query.isFetchingNextPage}
              fetchNextPage={query.fetchNextPage}
              />
            </div>
        </div>
      </div>
        )
}
```

## count the number of total comments

### src/modules/comments/server/procedure.ts

```ts
const [totalData]=await db
              .select({
                count:count(),
              })
              .from(comments)
							.where(inArray(comments.videoId,videoId ? [videoId]:[]))

                  .
                  .
                  .
return {
              totalCount:totalData.count,
              items,
              nextCursor,
            }
```

### src/modules/videos/ui/sections/comments-section.tsx

```tsx
<h1 className="text-xl font-bold">
            {comments.pages[0].totalCount} Comments
          </h1>
```

## Add InfiniteLoading component 

### src/modules/videos/ui/sections/comment-section.tsx

```tsx
export const CommentsSection=({videoId}:CommentsSectionProps)=>{
  return(
  <Suspense fallback={<CommentsSectionSkeleton/>}>
    <ErrorBoundary fallback={<p>Error</p>}>
      <CommentsSectionSuspense videoId={videoId}/>
    </ErrorBoundary>
  </Suspense>
  )
}

const CommentsSectionSkeleton=()=>{
  return(
    <div className="mt-6 flex justify-center items-center">
       <Loader2Icon className="text-muted-foreground size-7  animate-spin"/> 
    </div>
  )
}
```

## build delete comments procedure 

### src/modules/comments/server/procedure.ts

```ts
export const commentsRouter=createTRPCRouter({
  remove:protectedProcedure
  .input(z.object({
    id:z.string().uuid(),
  }))
  .mutation(async({input,ctx})=>{
    const {id}=input;
    const {id:userId}=ctx.user;
    const [deletedComment]= await db
         .delete(comments)
         .where(and(
          eq(comments.userId,userId),
          eq(comments.id,id),
         ))
         .returning()
         if(!deletedComment){
          throw new TRPCError({code:"NOT_FOUND"})
         }
      return deletedComment;
  }),  
```

### src/modules/comments/ui/components/comment-item.tsx

```tsx
import Link from "next/link";
import { CommentsGetManyOutput } from "../../types";
import { UserAvatar } from "@/components/user-avatar";
import { formatDistanceToNow } from "date-fns";
import{
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { MessageSquareCodeIcon, MessageSquareIcon, MoreVerticalIcon, Trash2Icon } from "lucide-react";
import { useAuth, useClerk } from "@clerk/nextjs";
import { toast } from "sonner";

interface CommentItemProps{
  comment:CommentsGetManyOutput["items"][number]
}

export const CommentItem=({
  comment,
}:CommentItemProps)=>{
  const clerk=useClerk();
  const {userId}=useAuth();
  const utils=trpc.useUtils();
  const remove=trpc.comments.remove.useMutation({
    onSuccess:()=>{
      toast.success("Comment deleted");
      utils.comments.getMany.invalidate({videoId:comment.videoId});
    },
    onError:(error)=>{
      toast.error("something went wrong");
      if(error.data?.code==="UNAUTHORIZED"){
        clerk.openSignIn();
      }
    },
  });
  return (
    <div>
      <div className="flex gap-4">
        <Link href={`/users/${comment.userId}`}>
          <UserAvatar
            size="lg"
            imageUrl={comment.user.imageUrl}
            name={comment.user.name}
          />
        </Link>
        <div className="flex-1 min-w-0">
          <Link href={`/users/${comment.userId}`}>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-medium text-sm pb-0.5">
                {comment.user.name}
                </span>  
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(comment.createdAt,{
                  addSuffix:true,
                })}
                </span>  
            </div>
          </Link>
          <p className="text-sm">{comment.value}</p>
          {/* TODO:Reactions */}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8">
              <MoreVerticalIcon/>
              </Button>    
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={()=>{}}>
              <MessageSquareIcon className="size-4"/>
              Reply
            </DropdownMenuItem>
            {/* 只有写该评论的人才有删除键 */}
            {comment.user.clerkId===userId &&(
            <DropdownMenuItem onClick={()=>remove.mutate({id:comment.id})}>
              <Trash2Icon className="size-4"/>
              Delete
            </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
```

# Chapter 24 comment reactions

## Requirements

We can like or dislike the comment,and the number of likes and dislikes will also displayin there

After liked the like or disliked the icon will also change 

and if we twice click the like and dislike button,it will cancel the like or dislike and decrease the number of that count

and we can also click the dislike after clicked the like button,and   then the related ui and number will automatically change 

## Workflow

![image-20250727171141069](/Users/a1/Library/Application Support/typora-user-images/image-20250727171141069.png)

## Add "commentReactions" schema

### src/db/schema.ts

```ts
export const userRelations=relations(users,({many})=>({
  videos:many(videos),
  videoViews:many(videoViews),
  videoReactions:many(videoReactions),
  subscriptions:many(subscriptions,{
    relationName:"subscriptions_viewer_id_fkey"
  }),
  subscribers:many(subscriptions,{
    relationName:"subscriptions_creator_id_fKey"
  }),
  comments:many(comments),
  commentReactions:many(commentReactions),
}))

export const commentRelations=relations(comments,({one,many})=>({
  user:one(users,{
    fields:[comments.userId],
    references:[users.id],
  }),
  video:one(videos,{
    fields:[comments.videoId],
    references:[videos.id],
  }),
  reactions:many(commentReactions)
}))

export const commentReactions=pgTable("comment_reactions",{
  userId:uuid("user_id").references(()=>users.id,{onDelete:"cascade"}).notNull(),
  videoId:uuid("video_id").references(()=>videos.id,{onDelete:"cascade"}).notNull(),
  commentId:uuid("comment_id").references(()=>comments.id,{onDelete:"cascade"}).notNull(),
  type:reactionType("type").notNull(),
  createdAt:timestamp("created_at").defaultNow().notNull(),
  updatedAt:timestamp("updated_at").defaultNow().notNull(),
},(t)=>[
    primaryKey({
      name:"comment_reactions_pk",
      columns:[t.userId,t.commentId],
    }),
  ])
  export const commentReactionRelations=relations(commentReactions,({one})=>({
    user:one(users,{
      fields:[commentReactions.userId],
      references:[users.id]
    }),
     video:one(videos,{
      fields:[commentReactions.videoId],
      references:[videos.id],
    comment:one(comments,{
      fields:[commentReactions.commentId], 
      references:[comments.id],
    }),
  }));
```

## create comment reactions UI

### src/modules/comments/ui/components/comment-item.tsx

```tsx
<div className="flex items-center">
              <Button
              disabled={false}
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={()=>{}}  
              >
                <ThumbsUpIcon
                className={cn()}
                />
                </Button>    
                <span className="text-xs text-muted-foreground">
                  0
                </span>
                <Button
              disabled={false}
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={()=>{}}  
              >
                <ThumbsDownIcon
                className={cn()}
                />
                </Button>  
                <span className="text-xs text-muted-foreground">
                  0
                </span>
            </div>
```

## count the number of like and dislike comments

### src/modules/comments/server/procedure.ts

getMany:

```ts
const data=await db
            .select({
              //getTableColumns(comments) 会获取 comments 表中的所有字段（如 id、value、createdAt 等），避免你手动写出每一列。
              ...getTableColumns(comments),
              //user: users 表示要把 users 整张表的字段作为一个嵌套对象返回，并命名为 user（用于 inner join 的结果）。
              user:users,
              likeCount:db.$count(
                commentReactions,
                and(
                  eq(commentReactions.type,"like"),
                  eq(commentReactions.commentId,comments.id),
                )
              ),
              dislikeCount:db.$count(
                commentReactions,
                and(
                  eq(commentReactions.type,"dislike"),
                  eq(commentReactions.commentId,comments.id),
                )
              ),
```

### src/modules/comments/ui/components/comment-item.tsx

```tsx
 <ThumbsUpIcon
                className={cn()}
                />
                </Button>    
                <span className="text-xs text-muted-foreground">
                  {comment.likeCount}
                </span>
                
<ThumbsDownIcon
                className={cn()}
                />
                </Button>  
                <span className="text-xs text-muted-foreground">
                {comment.dislikeCount}
                </span>
```

### src/modules/comments/server/procedure.ts

```tsx
.query(async({input,ctx})=>{
        const {clerkUserId}=ctx;
        const {videoId,cursor,limit}=input;
        let userId;

        const [user]=await db
            .select()
            .from(users)
            .where(inArray(users.clerkId,clerkUserId ? [clerkUserId]:[])) 
          if(user){
            userId=user.id;
          }  
        const viewerReactions=db.$with("viewer_reactions").as(
          db
            .select({
              commentId:commentReactions.commentId,
              type:commentReactions.type,
            })
            .from(commentReactions)
            .where(inArray(commentReactions.userId, userId ? [userId]:[]))
        )
        const [totalData]=await db
              .select({
                count:count(),
              })
              .from(comments)

        const data=await db
            .with(viewerReactions)  
            .select({
              //getTableColumns(comments) 会获取 comments 表中的所有字段（如 id、value、createdAt 等），避免你手动写出每一列。
              ...getTableColumns(comments),
              //user: users 表示要把 users 整张表的字段作为一个嵌套对象返回，并命名为 user（用于 inner join 的结果）。
              user:users,
              viewerReaction:viewerReactions.type,
              likeCount:db.$count(
                commentReactions,
                and(
                  eq(commentReactions.type,"like"),
                  eq(commentReactions.commentId,comments.id),
                )
              ),
              dislikeCount:db.$count(
                commentReactions,
                and(
                  eq(commentReactions.type,"dislike"),
                  eq(commentReactions.commentId,comments.id),
                )
              ),
            })
            .from(comments)
            .where(and(
              eq(comments.videoId,videoId),
              cursor
                ? or(
                  lt(comments.updatedAt,cursor.updatedAt),
                  and(
                    eq(comments.updatedAt,cursor.updatedAt),
                    lt(comments.id,cursor.id)
                  )
                )
                :undefined
              ))
            //把 comments 表与 users 表做 内连接（inner join）。这样你就能拿到每条评论的同时，知道评论者的用户信息。
            .innerJoin(users,eq(comments.userId,users.id))
            .leftJoin(viewerReactions,eq(comments.id,viewerReactions.commentId))
            .orderBy(desc(comments.updatedAt),desc(comments.id))  
            .limit(limit+1)
```

### src/modules/comments/ui/components/comment-item.tsx

```tsx
<ThumbsUpIcon
                className={cn(
                  comment.viewerReaction==="like" && "fill-black"
                )}
                />
                </Button>    
                <span className="text-xs text-muted-foreground">
                  {comment.likeCount}
                </span>
                <Button
              disabled={false}
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={()=>{}}  
              >
                <ThumbsDownIcon
                className={cn(
                  comment.viewerReaction==="dislike" && "fill-black"
                )}
                />
                </Button>  
                <span className="text-xs text-muted-foreground">
                {comment.dislikeCount}
                </span>
```

### create src/modules/comment-reactions/server/procedure.tsx

```tsx
import { db } from "@/db";
import { commentReactions } from "@/db/schema";
import {createTRPCRouter,protectedProcedure} from "@/trpc/init";
import { and,eq } from "drizzle-orm";
import { z } from "zod";

export const commentReactionsRouter=createTRPCRouter({
  like:protectedProcedure
    .input(z.object({commentId:z.string().uuid()}))
    .mutation(async({input,ctx})=>{
      const {commentId}=input;
      const {id:userId}=ctx.user;
      // The way of tracking views is going to be only for logged in users and only one view per user
      const [existingCommentReactionLike]=await  db
        .select()
        .from(commentReactions)
        .where(
          and(
            eq(commentReactions.commentId,commentId),
            eq(commentReactions.userId,userId),
            eq(commentReactions.type,"like")
          )
        );
        //removing our like
        if(existingCommentReactionLike){
          const [deletedCommentReaction]=await db
             .delete(commentReactions)
             .where(
              and(
                eq(commentReactions.userId,userId),
                eq(commentReactions.commentId,commentId),
              )
             ) 
             .returning();
             return deletedCommentReaction;
        }
        const [createCommentReaction]= await db
           .insert(commentReactions)
           .values({userId,commentId,type:"like"}) 
           //当我们之前已经点击过dislike时，会发生冲突，所以会重新设置为like
           .onConflictDoUpdate({
            target:[commentReactions.userId,commentReactions.commentId],
            set:{
              type:"like",
            },
           })
           .returning()
        return createCommentReaction;
    }),  
    dislike:protectedProcedure
    .input(z.object({commentId:z.string().uuid()}))
    .mutation(async({input,ctx})=>{
      const {commentId}=input;
      const {id:userId}=ctx.user;
      // The way of tracking views is going to be only for logged in users and only one view per user
      const [existingCommentReactionDislike]=await  db
        .select()
        .from(commentReactions)
        .where(
          and(
            eq(commentReactions.commentId,commentId),
            eq(commentReactions.userId,userId),
            eq(commentReactions.type,"dislike")
          )
        );
        //removing our like
        if(existingCommentReactionDislike){
          const [deletedCommentReaction]=await db
             .delete(commentReactions)
             .where(
              and(
                eq(commentReactions.userId,userId),
                eq(commentReactions.commentId,commentId),
              )
             ) 
             .returning();
             return deletedCommentReaction;
        }
        const [createCommentReaction]= await db
           .insert(commentReactions)
           .values({userId,commentId,type:"dislike"}) 
           .onConflictDoUpdate({
            target:[commentReactions.userId,commentReactions.commentId],
            set:{
              type:"dislike",
            },
           })
           .returning()
        return createCommentReaction;
    }), 
})

```

### src/trpc/routers/_app.ts

```ts
import { categoriesRouter } from '@/modules/categories/server/procedures';
import {createTRPCRouter } from '../init';
import { studioRouter } from '@/modules/studio/server/procedures';
import { videosRouter } from '@/modules/videos /server/procedures';
import { videoViewsRouter } from '@/modules/video-views/server/procedure';
import { videoReactionsRouter } from '@/modules/video-reactions/server/procedure';
import { subscriptionsRouter } from '@/modules/subscriptions/server/procedures';
import { commentsRouter } from '@/modules/comments/server/procedure';
import { commentReactionsRouter } from '@/modules/comment-reactions /server/procedure';
export const appRouter = createTRPCRouter({
   categories:categoriesRouter, 
   studio:studioRouter,
   videos:videosRouter,
   comments:commentsRouter,
   videoViews:videoViewsRouter,
   videoReactions:videoReactionsRouter,
   subscriptions:subscriptionsRouter,
   commentReactions:commentReactionsRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;
```

### src/modules/comments/ui/components/comment-item.tsx

```tsx
const like=trpc.commentReactions.like.useMutation({
    onSuccess:()=>{
      utils.comments.getMany.invalidate({videoId:comment.videoId})
    },
    onError:(error)=>{
      toast.error("something went wrong");
      if(error.data?.code==="UNAUTHORIZED"){
        clerk.openSignIn();
      }
    },
  })
  const dislike=trpc.commentReactions.dislike.useMutation({
    onSuccess:()=>{
      utils.comments.getMany.invalidate({videoId:comment.videoId})
    },
    onError:(error)=>{
      toast.error("something went wrong");
      if(error.data?.code==="UNAUTHORIZED"){
        clerk.openSignIn();
      }
    },
    
    
    
    <Button
              disabled={like.isPending}
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={()=>like.mutate({commentId:comment.id})}  
              >
                <ThumbsUpIcon
                className={cn(
                  comment.viewerReaction==="like" && "fill-black"
                )}
                />
                </Button>    
                <span className="text-xs text-muted-foreground">
                  {comment.likeCount}
                </span>
                <Button
              disabled={dislike.isPending}
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={()=>dislike.mutate({commentId:comment.id})} 
              >
                <ThumbsDownIcon
                className={cn(
                  comment.viewerReaction==="dislike" && "fill-black"
                )}
                />
                </Button>  
                <span className="text-xs text-muted-foreground">
                {comment.dislikeCount}
                </span>
            </div>
```

# Chapter 25 comment reply

## Requirements

when click the reply button ,I hope that it will alert a form, and then I can type some comments to reply to the parent comment.

And after I clicked the reply button , it's content will display below

and only the root comment will display a replies buttons ,this button will display all the child comments after click it and it also display  the total number of those replise

all the child comments will indent the same px for root comment

all the replies also have like,dislike,replies button

and only the owner of the comment can have right to delete the comment and all it's replies 

Suffix : child comment reply @ parent comment

## Workflow

![image-20250807140756453](/Users/a1/Library/Application Support/typora-user-images/image-20250807140756453.png)

![image-20250807140932986](/Users/a1/Library/Application Support/typora-user-images/image-20250807140932986.png)

## Extend comment schema by adding "parentId" and "rootId" foreign key

### src/db/schema.ts

```ts
// 在 comments 表中添加 rootId 字段
export const comments = pgTable("comments",{
  id: uuid("id").primaryKey().defaultRandom(),
  parentId: uuid("parentId"),
  rootId: uuid("rootId"), // 指向线程根评论
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  videoId: uuid("video_id").references(() => videos.id, { onDelete: "cascade" }).notNull(),
  value: text("value").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => {
  return [
    foreignKey({  
      columns: [t.parentId],
      foreignColumns: [t.id],
      name: "comments_parent_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [t.rootId],
      foreignColumns: [t.id],
      name: "comments_root_id_fkey",
    }).onDelete("cascade"),
  ]
});

// 更新评论关系
export const commentRelations = relations(comments, ({ one, many }) => ({
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
  video: one(videos, {
    fields: [comments.videoId],
    references: [videos.id],
  }),
  parent: one(comments, {
    fields: [comments.parentId],
    references: [comments.id],
    relationName: "comments_parent_id_fkey",
  }),
  root: one(comments, {
    fields: [comments.rootId],
    references: [comments.id],
    relationName: "comments_root_id_fkey",
  }),
  reactions: many(commentReactions),
  replies: many(comments, {
    relationName: "comments_parent_id_fkey",
  }),
}));
```

## create ui for replies

### src/modules/comments/ui/components/comment-item.tsx

```tsx
import Link from "next/link";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { useAuth, useClerk } from "@clerk/nextjs";
import { toast } from "sonner";
import { 
  MessageSquareIcon, 
  MoreVerticalIcon, 
  ThumbsDownIcon, 
  ThumbsUpIcon, 
  Trash2Icon,
  ChevronDownIcon,
  ChevronUpIcon
} from "lucide-react";
import type { CommentsGetManyOutput } from "../../types";
import { trpc } from "@/trpc/client";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { CommentForm } from "./comment-form";
import { CommentReplies } from "./comment-replies";

interface CommentItemProps {
  comment: CommentsGetManyOutput["items"][number];
  depth?: number;
}

export const CommentItem = ({
  comment,
  depth = 0,
}: CommentItemProps) => {
  const clerk = useClerk();
  const { userId } = useAuth();
  const [isReplyOpen, setIsReplyOpen] = useState(false);
  const [isRepliesOpen, setIsRepliesOpen] = useState(false);
  const utils = trpc.useUtils();

  const remove = trpc.comments.remove.useMutation({
    onSuccess: () => {
      toast.success("Comment deleted");
      utils.comments.getMany.invalidate({ videoId: comment.videoId });
    },
    onError: (error) => {
      toast.error("Something went wrong");
      if (error.data?.code === "UNAUTHORIZED") {
        clerk.openSignIn();
      }
    },
  });

  const like = trpc.commentReactions.like.useMutation({
    onSuccess: () => {
      utils.comments.getMany.invalidate({ videoId: comment.videoId });
    },
    onError: (error) => {
      toast.error("Something went wrong");
      if (error.data?.code === "UNAUTHORIZED") {
        clerk.openSignIn();
      }
    },
  });

  const dislike = trpc.commentReactions.dislike.useMutation({
    onSuccess: () => {
      utils.comments.getMany.invalidate({ videoId: comment.videoId });
    },
    onError: (error) => {
      toast.error("Something went wrong");
      if (error.data?.code === "UNAUTHORIZED") {
        clerk.openSignIn();
      }
    },
  });

  const commentTime = formatDistanceToNow(comment.createdAt, { addSuffix: true });

  // 判断是否为顶级评论
  const isTopLevel = !comment.rootId;

  return (
    <div className={cn("space-y-2", !isTopLevel && "ml-10")}>
      <div className="flex gap-4">
        <Link href={`/users/${comment.userId}`}>
          <UserAvatar
            size={isTopLevel ? "lg" : "sm"}
            imageUrl={comment.user.imageUrl}
            name={comment.user.name}
          />
        </Link>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <Link href={`/users/${comment.userId}`}>
              <span className="font-medium text-sm pb-0.5">
                {comment.user.name}
              </span>
            </Link>
            <span className="text-xs text-muted-foreground">
              {commentTime}
            </span>
          </div>
          
          <div className="mt-1">
            {/* 显示回复链（非顶级评论且不是直接回复顶级评论） */}
            {!isTopLevel && comment.parentUser && comment.parentUser.id !== comment.rootId && (
              <span className="text-xs text-muted-foreground mr-2">
                Reply to <span className="text-blue-500">@{comment.parentUser.name}</span>
              </span>
            )}
            <p className="text-sm inline">{comment.value}</p>
          </div>
          
          <div className="flex items-center gap-7 mt-2">
            {/* 点赞部分 */}
            <div className="flex items-center gap-1">
              <Button
                disabled={like.isPending}
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => like.mutate({ commentId: comment.id, videoId: comment.videoId })}
              >
                <ThumbsUpIcon
                  className={cn(comment.viewerReaction === "like" && "fill-black")}
                />
              </Button>
              {comment.likeCount > 0 && (
                <span className="text-xs text-muted-foreground">{comment.likeCount}</span>
              )}
            </div>
            
            {/* 点踩部分 */}
            <div className="flex items-center gap-1">
              <Button
                disabled={dislike.isPending}
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => dislike.mutate({ commentId: comment.id, videoId: comment.videoId })}
              >
                <ThumbsDownIcon
                  className={cn(comment.viewerReaction === "dislike" && "fill-black")}
                />
              </Button>  
              {comment.dislikeCount > 0 && (
                <span className="text-xs text-muted-foreground">{comment.dislikeCount}</span>
              )} 
            </div>   

            <Button
              variant="ghost"
              size="sm"
              className="h-8"
              onClick={() => setIsReplyOpen(!isReplyOpen)}
            >
              <MessageSquareIcon className="size-4 mr-1" />
              Reply
            </Button>

            {/* 只对顶级评论显示回复数 */}
            {isTopLevel && comment.replyCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8"
                onClick={() => setIsRepliesOpen(!isRepliesOpen)}
              >
                {isRepliesOpen ? (
                  <ChevronUpIcon className="size-4 mr-1" />
                ) : (
                  <ChevronDownIcon className="size-4 mr-1" />
                )}
                {comment.replyCount} replies
              </Button>
            )}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8">
              <MoreVerticalIcon />
            </Button>    
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setIsReplyOpen(true)}>
              <MessageSquareIcon className="size-4 mr-2" />
              Reply
            </DropdownMenuItem>
            {comment.user.clerkId === userId && (
              <DropdownMenuItem onClick={() => remove.mutate({ id: comment.id })}>
                <Trash2Icon className="size-4 mr-2" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {isReplyOpen && (
        <div className="mt-4 pl-14">
          <CommentForm
            variant="reply"
            parentId={comment.id}
            videoId={comment.videoId}
            onCancel={() => setIsReplyOpen(false)}
            onSuccess={() => {
              setIsReplyOpen(false);
              setIsRepliesOpen(true);
              utils.comments.getMany.invalidate({ videoId: comment.videoId });
            }}
          />
        </div>
      )}

      {/* 只对顶级评论显示回复列表 */}
      {isTopLevel && isRepliesOpen && comment.replyCount > 0 && (
        <CommentReplies
          rootId={comment.id} // 使用 rootId 而不是 parentId
          videoId={comment.videoId}
          depth={depth + 1}
        />
      )}
    </div>
  );
};
```

### src/modules/comments/ui/components/comment-form.tsx

```tsx
'use client'

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/components/user-avatar";
import { useUser, useClerk } from "@clerk/nextjs";
import { z } from "zod";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { trpc } from "@/trpc/client";
import { commentInsertSchema } from "@/db/schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage
} from "@/components/ui/form";

interface CommentFormProps {
  videoId: string;
  parentId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  variant?: "comment" | "reply";
}

export const CommentForm = ({
  videoId,
  parentId,
  onSuccess,
  onCancel,
  variant = "comment",
}: CommentFormProps) => {
  const clerk = useClerk();
  const { user } = useUser();
  const utils = trpc.useUtils();
  
  const create = trpc.comments.create.useMutation({
    onSuccess: () => {
      // 使顶级评论列表失效
      utils.comments.getMany.invalidate({ videoId, rootId: null });
      
      // 如果是回复，使特定根评论的回复列表失效
      if (variant === "reply" && parentId) {
        // 使用 rootId 参数而不是 parentId
        utils.comments.getMany.invalidate({ videoId, rootId: parentId });
      }
      form.reset();
      toast.success("Comment added");
      onSuccess?.();
    },
    onError: (error) => {
      toast.error("Something went wrong");
      if (error.data?.code === "UNAUTHORIZED") {
        clerk.openSignIn();
      }
    }
  });

  const formSchema = commentInsertSchema.omit({ userId: true });
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      videoId,
      value: "",
      parentId: variant === "reply" ? parentId : undefined,
    },
  });

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    create.mutate({
      ...values,
      parentId: variant === "reply" ? parentId : undefined
    });
  };

  const handleCancel = () => {
    form.reset();
    onCancel?.();
  };

  return (
    <Form {...form}>
      <form 
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex gap-4 group"
      >
        <UserAvatar
          size="lg"
          imageUrl={user?.imageUrl || "/user-placeholder.svg"}
          name={user?.username || "User"}
        />
        <div className="flex-1 flex flex-col gap-2">
          <FormField
            name="value"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder={
                      variant === "reply"
                        ? "Write your reply..."
                        : "Add a comment..."
                    }
                    className="resize-none bg-transparent overflow-hidden min-h-0"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="justify-end gap-2 flex">
            {onCancel && (
              <Button
                variant="ghost"
                type="button"
                onClick={handleCancel}
              >
                Cancel
              </Button>
            )}
            <Button
              disabled={create.isPending}
              type="submit"
              size="sm"
            >
              {variant === "reply" ? "Reply" : "Comment"}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
};
```



> 创建parentId
>
> click "reply" button--->set isReplyOpen(true)--->display reply commentForm,pass parentId={comment.id}--->
> const handleSubmit = (values: z.infer<typeof formSchema>) => {
>     create.mutate({
>       ...values,
>       parentId: variant === "reply" ? parentId : undefined
>     });
>   };
>
> 根据variant是reply还是comment来区分评论和reply的表格,以及对parentId的设定

## Update create,getMany procedure

### src/modules/comments/server/procedure.ts

```ts
  // 修改 create 过程
create: protectedProcedure
.input(
  z.object({
    parentId: z.string().uuid().nullish(),
    videoId: z.string().uuid(),
    value: z.string(),
  }),
)
.mutation(async ({ input, ctx }) => {
  const { videoId, value, parentId } = input;
  const { id: userId } = ctx.user;

  let rootId: string | null = null;

  if (parentId) {
    // 获取父评论以确定 rootId
    const [parentComment] = await db
      .select()
      .from(comments)
      .where(eq(comments.id, parentId));

    if (!parentComment) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    // 如果父评论有 rootId，则使用它，否则使用父评论 ID
    rootId = parentComment.rootId || parentComment.id;
  }

  const [createdComment] = await db
    .insert(comments)
    .values({ 
      userId, 
      videoId, 
      value, 
      parentId: parentId || null,
      rootId // 设置 rootId
    })
    .returning();

  return createdComment;
}),

    getMany: baseProcedure
    .input(
      z.object({
        videoId: z.string().uuid(),
        rootId: z.string().uuid().nullish(), // 改为 rootId 而不是 parentId
        cursor: z.object({
          id: z.string().uuid(),
          updatedAt: z.date(),
        }).nullish(),
        limit: z.number().min(1).max(100),
      }),
    ) 
    .query(async ({ input, ctx }) => {
      const { clerkUserId } = ctx;
      const { videoId, cursor, limit, rootId } = input; // 改为 rootId
      let userId;
  
      const [user] = await db
        .select()
        .from(users)
        .where(inArray(users.clerkId, clerkUserId ? [clerkUserId] : []));
      if (user) {
        userId = user.id;
      }  
  
      const viewerReactions = db.$with("viewer_reactions").as(
        db
          .select({
            commentId: commentReactions.commentId,
            type: commentReactions.type,
          })
          .from(commentReactions)
          .where(inArray(commentReactions.userId, userId ? [userId] : []))
      );
  
      // 修改为基于 rootId 统计回复数量
      const replies = db.$with("replies").as(
        db
          .select({
            rootId: comments.rootId,
            count: count(comments.id).as("count"),
          })
          .from(comments)
          .where(isNotNull(comments.rootId))
          .groupBy(comments.rootId),
      );
  
      const [totalComments] = await db
        .select({ 
          count: count() 
        })
        .from(comments)
        .where(
          and(
            eq(comments.videoId, videoId)
          )
        );
      
      const data = await db
        .with(viewerReactions, replies)  
        .select({
          ...getTableColumns(comments),
          user: users,
          parentUser: {
            id: sql<string>`parent_users.id`.as('parent_user_id'),
            name: sql<string>`parent_users.name`.as('parent_user_name'),
            imageUrl: sql<string>`parent_users.image_url`.as('parent_user_image_url')
          },
          viewerReaction: viewerReactions.type,
          replyCount: replies.count,
          likeCount: db.$count(
            commentReactions,
            and(
              eq(commentReactions.type, "like"),
              eq(commentReactions.commentId, comments.id),
            )
          ),
          dislikeCount: db.$count(
            commentReactions,
            and(
              eq(commentReactions.type, "dislike"),
              eq(commentReactions.commentId, comments.id),
            )
          ),
        })
        .from(comments)
        .where(and(
          eq(comments.videoId, videoId),
          rootId
            ? eq(comments.rootId, rootId) // 使用 rootId 查询
            : isNull(comments.rootId), // 顶级评论的 rootId 为 null
          cursor
            ? or(
                lt(comments.updatedAt, cursor.updatedAt),
                and(
                  eq(comments.updatedAt, cursor.updatedAt),
                  lt(comments.id, cursor.id)
                )
              )
            : undefined
        ))
        .innerJoin(users, eq(comments.userId, users.id))
        .leftJoin(viewerReactions, eq(comments.id, viewerReactions.commentId))
        .leftJoin(replies, eq(comments.id, replies.rootId))
        //修复：先创建 parent_comments 子查询
        .leftJoin(
          db.select().from(comments).as("parent_comments"),
          eq(comments.parentId, sql`parent_comments.id`)
        )
        // 然后才能引用 parent_users
        .leftJoin(
          db.select({
            id: users.id,
            name: users.name,
            imageUrl: users.imageUrl,
          }).from(users).as("parent_users"),
          eq(sql`parent_comments.user_id`, sql`parent_users.id`)  
        )
        .orderBy(desc(comments.updatedAt), desc(comments.id))  
        .limit(limit + 1);
  
      const hasMore = data.length > limit;
      const items = hasMore ? data.slice(0, -1) : data;
      const lastItem = items[items.length - 1];
      const nextCursor = hasMore ? {
        id: lastItem.id,
        updatedAt: lastItem.updatedAt
      } : null;
  
      return {
        items,
        nextCursor,
        totalCount: totalComments.count,
      };        
    }),
```



> 在此创建rootId
>
> ```ts
>   let rootId: string | null = null;
> 
>   if (parentId) {
>     // 获取父评论以确定 rootId
>     const [parentComment] = await db
>       .select()
>       .from(comments)
>       .where(eq(comments.id, parentId));
> 
>     if (!parentComment) {
>       throw new TRPCError({ code: "NOT_FOUND" });
>     }
> 
>     // 如果父评论有 rootId，则使用它，否则使用父评论 ID
>     rootId = parentComment.rootId || parentComment.id;
>   }
> 
>   const [createdComment] = await db
>     .insert(comments)
>     .values({ 
>       userId, 
>       videoId, 
>       value, 
>       parentId: parentId || null,
>       rootId // 设置 rootId
>     })
>     .returning();
> ```

### create src/modules/comments/ui/components/comment-replies.tsx

```tsx
'use client'

import { DEFAULT_LIMIT } from "@/constants";
import { trpc } from "@/trpc/client";
import { Loader2Icon } from "lucide-react";
import { CommentItem } from "./comment-item";
import { Button } from "@/components/ui/button";
import type { CommentsGetManyOutput } from "../../types";

interface CommentRepliesProps {
  rootId: string; // 改为 rootId 而不是 parentId
  videoId: string;
  depth?: number;
}

export const CommentReplies = ({
  rootId,
  videoId,
  depth = 0,
}: CommentRepliesProps) => {
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = trpc.comments.getMany.useInfiniteQuery(
    {
      limit: DEFAULT_LIMIT,
      videoId,
      rootId, // 使用 rootId 查询
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );

  return (
    <div className="mt-2">
      <div className="flex flex-col gap-4">
        {isLoading && (
          <div className="flex items-center justify-center">
            <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {!isLoading &&
          data?.pages
            .flatMap((page) => page.items)
            .map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                depth={depth + 1}
              />
            ))}
      </div>
      {hasNextPage && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          className="mt-2"
        >
          {isFetchingNextPage ? (
            <Loader2Icon className="size-4 mr-2 animate-spin" />
          ) : (
            "Show more replies"
          )}
        </Button>
      )}
    </div>
  );
};
```

![image-20250806012344228](/Users/a1/Library/Application Support/typora-user-images/image-20250806012344228.png)



# Chapter 25 Suggestions

## Requirements

I hope the one video page right side will display all the videos list which their categoryId equals the specific video when the screen is large,and below the video description part when the screen is md size

The suggestion list will display video's thumbnail, avatar,username,title,likes and dislike counts, description view count

## Workflow

![image-20250807155343399](/Users/a1/Library/Application Support/typora-user-images/image-20250807155343399.png)

## Create suggestions procedure

### src/modules/suggestions/server/procedures.ts

```ts
import { db} from "@/db";
import { users, videoReactions, videoViews, videos } from "@/db/schema";
import {z} from 'zod';
import { createTRPCRouter, baseProcedure } from "@/trpc/init";
import { eq,and,or,lt,desc,getTableColumns, not} from "drizzle-orm";
import { TRPCError } from "@trpc/server";
export const suggestionsRouter=createTRPCRouter({
  getMany:baseProcedure
  .input(
    z.object({
      videoId:z.string().uuid(),
      cursor:z.object({
        id:z.string().uuid(),
        updatedAt:z.date(),
      })
      .nullish(),
      limit:z.number().min(1).max(100),
    })
  )
  .query(async({ input })=>{
    const {videoId,cursor,limit}=input;
    const [existingVideo]=await db
          .select()
          .from(videos)
          .where(eq(videos.id,videoId))
    if(!existingVideo){
      throw new TRPCError({code:"NOT_FOUND"});
    }      
    const data=await db
      .select({
        ...getTableColumns(videos),
        user:users,
        viewCount:db.$count(videoViews,eq(videoViews.videoId,videos.id)),
        likeCount:db.$count(videoReactions,and(
          eq(videoReactions.videoId,videos.id),
          eq(videoReactions.type,"like"),
          )),
        dislikeCount:db.$count(videoReactions,and(
          eq(videoReactions.videoId,videos.id),
          eq(videoReactions.type,"dislike"),
          )),  
      }
      )
      .from(videos)
      .innerJoin(users,eq(videos.userId,users.id))
      .where(and(
        not(eq(videos.id,existingVideo.id)),
        eq(videos.visibility,"public"),
        existingVideo.categoryId
        ?
        eq(videos.categoryId,existingVideo.categoryId)
        :undefined,
        existingVideo.description
        ?
        ilike(videos.description,existingVideo.description):undefined,
        cursor
          ? or(
            lt(videos.updatedAt,cursor.updatedAt),
            and(
              eq(videos.updatedAt,cursor.updatedAt),
              lt(videos.id,cursor.id)
            ))
          :undefined,
        )).orderBy(desc(videos.updatedAt),desc(videos.id))
        // Add 1 to the limit to check if there is more data
        .limit(limit+1)
        const hasMore=data.length >limit
        //remove the last item if there is more data
        const items=hasMore ?data.slice(0,-1):data
        //set the next cursor to the last item if there is more data
        const lastItem=items[items.length-1];
        const nextCursor=hasMore ?
          {
            id:lastItem.id,
            updatedAt:lastItem.updatedAt
          }:null;
      return {
        items,
        nextCursor
      };
  }),
})
```

### src/trpc/routers/_app.ts

```ts
import { categoriesRouter } from '@/modules/categories/server/procedures';
import {createTRPCRouter } from '../init';
import { studioRouter } from '@/modules/studio/server/procedures';
import { videoViewsRouter } from '@/modules/video-views/server/procedure';
import { videoReactionsRouter } from '@/modules/video-reactions/server/procedure';
import { subscriptionsRouter } from '@/modules/subscriptions/server/procedures';
import { commentsRouter } from '@/modules/comments/server/procedure';
import { commentReactionsRouter } from '@/modules/comment-reactions /server/procedure';
import { videosRouter } from '@/modules/videos /server/procedures';
import { suggestionsRouter } from '@/modules/suggestions/server/procedures';
export const appRouter = createTRPCRouter({
   categories:categoriesRouter, 
   studio:studioRouter,
   videos:videosRouter,
   comments:commentsRouter,
   videoViews:videoViewsRouter,
   videoReactions:videoReactionsRouter,
   subscriptions:subscriptionsRouter,
   commentReactions:commentReactionsRouter,
   suggestions:suggestionsRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;
```

## Prefetch suggestions

### src/app/(home)/videos/[videoId]/page.tsx

```tsx
import { DEFAULT_LIMIT } from '@/constants';
import { VideoView } from '@/modules/videos /ui/views/video-views';
import { HydrateClient, trpc } from '@/trpc/server';
interface PageProps{
  params:Promise<{
    videoId:string
  }>
}
const Page = async ({params}:PageProps) => {
  const {videoId}= await params;
  void trpc.videos.getOne.prefetch({id: videoId});
  //TODO don't forget to change 
  void trpc.comments.getMany.prefetchInfinite({videoId,limit:DEFAULT_LIMIT});
  
  void trpc.suggestions.getMany.prefetchInfinite({videoId,limit:DEFAULT_LIMIT});

  return (
    <HydrateClient>
      <VideoView videoId={videoId}/>
    </HydrateClient>
  )
}

export default Page
```

##  create videoRowCard

### create src/modules/videos/ui/sections/suggestions-section.tsx

```tsx
"use client";
import { DEFAULT_LIMIT } from "@/constants";
import { trpc } from "@/trpc/client";
import { VideoRowCard, VideoRowCardSkeleton } from "../components/video-row-card";
import { VideoGridCard, VideoGridCardSkeleton } from "../components/video-grid-card";
import { InfiniteScroll } from "@/components/infinite-scroll";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useRouter } from "next/navigation";
import { toast } from "sonner";


interface SuggestionsSectionProps{
  videoId:string;
  isManual?:boolean;
}

 export const SuggestionsSection=({
  videoId,
  isManual,
 }:SuggestionsSectionProps)=>{
    return(
      <Suspense fallback={<SuggestionsSectionSkeleton/>}>
        <ErrorBoundary fallback={<p>Error</p>}>
          <SuggestionsSectionSuspense videoId={videoId} isManual={isManual}/>
        </ErrorBoundary>
      </Suspense>
    )
 } 

 const SuggestionsSectionSkeleton=()=>{
  return (
    <>
    <div className="hidden md:block space-y-3">
      {/* Array.from({ length: 8 })功能：创建一个包含8个空位的数组（实际值为undefined）,遍历数组的每个元素（忽略值_），通过索引index生成内容。 */}
      {Array.from({length:5}).map((_,index)=>(
        <VideoRowCardSkeleton key={index} size="default"/>
      ))}
    </div>
    <div className="block md:hidden space-y-10">
      {Array.from({length:5}).map((_,index)=>(
        <VideoGridCardSkeleton key={index} />
      ))}
    </div>
    </>
  )
 }

 const SuggestionsSectionSuspense=({
  videoId,
  isManual,
}:SuggestionsSectionProps)=>{
  const [suggestions,query]=trpc.suggestions.getMany.useSuspenseInfiniteQuery({
     videoId,
     limit:DEFAULT_LIMIT, 
  },{
    getNextPageParam:(lastPage)=>lastPage.nextCursor,
  })
  
  return(
    <>
    {/* md:768px 及以上 */}
  <div className="hidden md:block space-y-3">
    {suggestions.pages.flatMap((page)=>page.items.map((video)=>(
      <VideoRowCard
      key={video.id}
      data={video}
      size="default"
      />
    )))}
  </div>
  <div className="block md:hidden space-y-10">
  {suggestions.pages.flatMap((page)=>page.items.map((video)=>(
      <VideoGridCard
      key={video.id}
      data={video}
      />
    )))}
  </div>
  <InfiniteScroll
    isManual={isManual}
    hasNextPage={query.hasNextPage}
    isFetchingNextPage={query.isFetchingNextPage}
    fetchNextPage={query.fetchNextPage}
  />
  </>
  )
}
```

### Src/modules/videos/types.ts

```ts
import {inferRouterOutputs} from "@trpc/server";
import {AppRouter} from "@/trpc/routers/_app";
//TODO :change to videos getMany       
export type VideoGetManyOutput=
       inferRouterOutputs<AppRouter>["suggestions"]["getMany"];             
```

### src/modules/videos/ui/components/video-row-card.tsx

```tsx
import Link from "next/link";
import{useMemo} from "react";
import {cva,type VariantProps} from "class-variance-authority";
import {cn} from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import{
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { UserAvatar } from "@/components/user-avatar";
import {UserInfo} from "@/modules/users/ui/components/user-info"
import { VideoMenu } from "./video-menu";
import { VideoThumbnail, VideoThumbnailSkeleton } from "./video-thumbnail";
import {VideoGetManyOutput} from "../../types";
import { formatDistanceToNow } from "date-fns";

const videoRowCardVariants=cva("group flex min-w-0",{
  variants:{
    size:{
      default:"gap-3",
      compact:"gap-2",
    }
  },
  defaultVariants:{
    size:"default",
  }
})

const thumbnailVariants=cva("relative flex-none",{
  variants:{
    size:{
      default:"w-[35%]",
      compact:"w-[168px]",
    },
  defaultVariants:{
    size:"default",
  }  
  }
});

interface VideoRowCardProps extends VariantProps<typeof videoRowCardVariants>{
  data:VideoGetManyOutput["items"][number];
  onRemove?:()=>void;
}

export const VideoRowCardSkeleton=({size="default"}:VariantProps<typeof videoRowCardVariants>)=>{
  return (
    <div className={videoRowCardVariants({size})}>
      <div className={thumbnailVariants({size})}>
        <VideoThumbnailSkeleton/>
      </div>
      {/* Info skeleton */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between gap-x-2">
          <div className="flex-1 min-w-0">
             <Skeleton
             className={cn("h-5 w-[40%]",size==="compact" && "h-4 w-[40%]")}
             /> 
             {size==="default" &&(
              <>
                <Skeleton className="h-4 w-[20%] mt-1"/>
                <div className="flex items-center gap-2 my-3">
                  <Skeleton className="size-8 rounded-full"/>
                  <Skeleton className="h-4 w-24"/>
                </div>
              </>
             )}
             {size==="compact" &&(
              <>
              <Skeleton className="h-4 w-[50%] mt-1"/>
              </>
             )}
          </div>
        </div>
      </div>
    </div>
  )
}


export const VideoRowCard=({
  data,
  onRemove,
  size="default",
}:VideoRowCardProps)=>{
  const compactViews=useMemo(()=>{
    return Intl.NumberFormat("en",{
      notation:"compact"
    }).format(data.viewCount)
  },[data.viewCount])

  const compactLikes=useMemo(()=>{
    return Intl.NumberFormat("en",{
      notation:"compact"
    }).format(data.likeCount)
  },[data.likeCount])
  const compactDate=useMemo(()=>{
    return formatDistanceToNow(data.createdAt,{addSuffix:true});},[data.viewCount])
  return(
    <div className={videoRowCardVariants({size})}>
      <Link href={`/videos/${data.id}`} className={thumbnailVariants({size})}>
        <VideoThumbnail
        imageUrl={data.thumbnailUrl}
        previewUrl={data.previewUrl}
        title={data.title}
        duration={data.duration}
        />
      </Link>
      {/* Info part  */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between gap-x-2">
          <Link href={`/videos/${data.id}`} className="">
            <h3
            className={cn(
              "font-medium line-clamp-2",
              size==="compact" ? "text-sm":"text-base",
            )}
            >
              {data.title}
            </h3>
            {size==="default" &&(
              <p className="text-sm text-muted-foreground">
                {compactViews} views • {compactLikes} likes  {compactDate} 
              </p>
            )}
            {size==="default" &&(
              <>
              <div className="flex items-center gap-2 my-3">
                <UserAvatar
                size="sm"
                imageUrl={data.user.imageUrl}
                name={data.user.name}
                />
                <UserInfo size="sm" name={data.user.name}/>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="text-xs text-muted-foreground w-fit line-clamp-2">
                    {data.description ?? "No description"}
                  </p>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  align="center"
                  className="bg-black/70"
                >
                  <p>From the video description</p> 
                </TooltipContent>
              </Tooltip>
              </>
            )}
            {size==="compact" && (
              <UserInfo size="sm" name={data.user.name}/>
            )}
            {size==="compact" && (
              <p className="text-sm text-muted-foreground mt-1">
                {compactViews} views • {compactLikes} likes
              </p>
            )}
          </Link>
          <div className="flex-none ">
              <VideoMenu videoId={data.id} onRemove={onRemove}/>
          </div>
        </div>
      </div>
    </div>
  )
}
```

### src/modules/videos/ui/components/video-grid-card.tsx

```tsx
import Link from "next/link";
import {VideoGetManyOutput} from "../../types";
import { VideoThumbnail, VideoThumbnailSkeleton } from "./video-thumbnail";
import { VideoInfo, VideoInfoSkeleton } from "./video-info";

interface VideoGridCardProps{
  data:VideoGetManyOutput["items"][number];
  onRemove?:()=>void;
}

export const VideoGridCardSkeleton=()=>{
  return(
    <div className="flex flex-col gap-2 w-full">
      <VideoThumbnailSkeleton/>
      <VideoInfoSkeleton/>
    </div>
  )
}

export const VideoGridCard=({
  data,
  onRemove,
}:VideoGridCardProps)=>{
  return(
    <div className="flex flex-col gap-2 w-full group">
      <Link href={`/videos/${data.id}`}>
      <VideoThumbnail
        imageUrl={data.thumbnailUrl}
        previewUrl={data.previewUrl}
        title={data.title}
        duration={data.duration}
        />
      </Link>
      <VideoInfo data={data} onRemove={onRemove}/>
    </div>
  )
}
```

### src/modules/videos/ui/components/video-info.tsx

```tsx
import { formatDistanceToNow } from "date-fns";
import {VideoGetManyOutput} from "../../types";
import { useMemo } from "react";
import Link from "next/link";
import { UserAvatar } from "@/components/user-avatar";
import { UserInfo } from "@/modules/users/ui/components/user-info";
import { VideoMenu } from "./video-menu";
import { Skeleton } from "@/components/ui/skeleton";
interface VideoInfoProps{
  data:VideoGetManyOutput["items"][number];
  onRemove?:()=>void;
}

export const VideoInfoSkeleton=()=>{
  return(
    <div className="flex gap-3">
      {/* 当弹性容器（flex container）空间不足时，默认情况下子项目（flex item）会按比例缩小以适应容器。添加 flex-shrink-0 后，该项目将保持原始尺寸，拒绝收缩。使用场景：
        固定侧边栏宽度
        保持图标或按钮尺寸稳定
        防止文本内容被挤压变形 */}
      <Skeleton className="size-10 flex-shrink-0 rounded-full"/>
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-5 w=[90%]"/>
        <Skeleton className="h-5 w=[70%]"/>
      </div>
    </div>
  )
}

export const VideoInfo=({data,onRemove}:VideoInfoProps)=>{
  const compactViews=useMemo(()=>{
    return Intl.NumberFormat("en",{
      notation:"compact"
    }).format(data.viewCount)
  },[data.viewCount])
  const compactDate=useMemo(()=>{
    return formatDistanceToNow(data.createdAt,{addSuffix:true});},[data.viewCount])

    return (
      <div className="flex gap-3">
        <Link href={`/users/${data.user.id}`}>
          <UserAvatar imageUrl={data.user.imageUrl} name={data.user.name}/>
        </Link>
        <div className="min-w-0 flex-1">
          <Link href={`/videos/${data.id}`}>
            {/* break-words:Long words will break and wrap instead of overflowing. */}
            <h3 className="font-medium line-clamp-1 lg:line-clamp-2 text-base break-words">
              {data.title}
            </h3>
          </Link>
          <Link href={`/users/${data.user.id}`}>
            <UserInfo name={data.user.name}/>
          </Link>
          <Link href={`/videos/${data.id}`}>
            <p className="text-sm text-gray-600 line-clamp-1">
              {compactViews} views • {compactDate}
            </p>
          </Link>
        </div>
        <div className="flex-shrink-0">
          <VideoMenu videoId={data.id} onRemove={onRemove}/>
        </div>
      </div>
    )
}
```

# Chapter 26 Search

## Requirements

When I type some value in our search input and after clicked the search button,I hope the url will be changed immediately into ?query="value"&category=""(if you clicked the category button).

and based on the value I typed,it will display bothe the user profiles or videos that match the search value.

and we can click the user profile,and enter this user's space, subscribe he or she,or just browse their space

we also have the filter after the default search result rendered in this page. in default , the video is desc by updated time and videos.id,but you can choose desc by view counts.

And after I type the value in search input, it will appear a X icon,and after I clicked it the value in this input will disappear. 

## Workflow

![image-20250809225116682](/Users/a1/Library/Application Support/typora-user-images/image-20250809225116682.png)

## Create search page

### src/app/(home)/search/page.tsx

```tsx
import { DEFAULT_LIMIT } from "@/constants";
import { SearchView } from "@/modules/search/ui/views/search-view";
import { HydrateClient, trpc } from "@/trpc/server";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    query: string | undefined;
    categoryId: string | undefined;
    sort: string | undefined; // 添加排序参数
  }>;
}

const Page = async ({ searchParams }: PageProps) => {
  const { query, categoryId, sort } = await searchParams;
  
  // 预取数据
  void trpc.categories.getMany.prefetch();
  void trpc.search.getMany.prefetchInfinite({
    query,
    categoryId,
    sortBy: sort as "default" | "views" | undefined, // 添加排序参数
    limit: DEFAULT_LIMIT,
  });
  
  return (
    <HydrateClient>
      <SearchView query={query} categoryId={categoryId} />
    </HydrateClient>
  );
};

export default Page;
```

## create a constant APP_URL

#### src/constants.tsx

```tsx
export const APP_URL=process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
```

## Create Search UI

### src/modules/home/ui/components/home-navbar/SearchInput.tsx

```tsx
"use client";

import { Button } from "@/components/ui/button";
import { APP_URL } from "@/constants";
import { SearchIcon, XIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useState, useEffect } from "react";

export const SearchInput = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // 从 URL 参数中获取当前值
  const query = searchParams.get("query") || "";
  const categoryId = searchParams.get("categoryId") || "";
  
  // 状态管理输入值
  const [value, setValue] = useState(query);
  
  // 当 URL 参数变化时更新输入值
  useEffect(() => {
    setValue(query);
  }, [query]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newQuery = value.trim();
    const params = new URLSearchParams();
    
    // 设置查询参数 - 保留空格
    if (newQuery) {
      // 直接设置值，不进行 encodeURIComponent
      params.set("query", newQuery);
    }
    
    // 保留分类ID
    if (categoryId) {
      params.set("categoryId", categoryId);
    }
    
    // 构建 URL 并导航
    const url = `${APP_URL}/search?${params.toString()}`;
    router.push(url);
  };
  
  // 清除搜索
  const handleClear = () => {
    setValue("");
    
    // 如果当前在搜索页面，清除查询参数
    if (window.location.pathname === "/search") {
      const params = new URLSearchParams();
      
      // 保留分类ID
      if (categoryId) {
        params.set("categoryId", categoryId);
      }
      
      const url = `${APP_URL}/search?${params.toString()}`;
      router.push(url);
    }
  };

  return (
    <form className="flex w-full max-w-[600px]" onSubmit={handleSearch}>
      <div className="relative w-full">
        <input 
          value={value}
          onChange={(e) => setValue(e.target.value)}
          type="text"
          placeholder="Search"
          className="w-full pl-4 py-2 pr-12 rounded-l-full border focus:outline-none focus:border-blue-500"  
        />
        
        {/* 清除按钮 */}
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full"
          >
            <XIcon className="text-gray-500 size-5" />
          </Button>
        )}
      </div>
      
      {/* 搜索按钮 - 保持原有样式 */}
      <button
        disabled={!value.trim()} 
        type="submit"
        className='px-5 py-2.5 bg-gray-100 border border-l-0 rounded-r-full hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed'
      >
        <SearchIcon className="size-5" />
      </button>
    </form>
  );
};
```

### create src/modules/search/ui/views/search-view.tsx

```tsx
import { CategoriesSection } from "../sections/categories-section";
import { ResultsSection } from "../sections/results-section";

interface PageProps{
    query:string | undefined;
    categoryId:string | undefined;
}

export const SearchView=({
  query,
  categoryId,
}:PageProps)=>{
  return(
    <div className="max-w-[1300px] mx-auto mb-10 flex flex-col gap-y-6 px-4 pt-2.5">
       <CategoriesSection categoryId={categoryId}/> 
       <ResultsSection  query={query} categoryId={categoryId}/>
    </div>
  )
}
```

### create src/modules/search/ui/sections/categories-section.tsx

```tsx
"use client";
import { trpc } from '@/trpc/client';
import {ErrorBoundary} from 'react-error-boundary';
import React, { Suspense } from 'react'
import { FilterCarousel } from '@/components/filter-carousel';
import { useRouter } from 'next/navigation';
interface CategoriesSectionProps{
  categoryId?:string;
};

export const CategoriesSection=({categoryId}:CategoriesSectionProps)=>{
  return (
    <Suspense fallback={<FilterCarousel isLoading data={[]} onSelect={()=>{}}/>}>
      <ErrorBoundary fallback={<p>Error...</p>}>
        <CategoriesSectionSuspense categoryId={categoryId}/>
      </ErrorBoundary>
    </Suspense>
  )
}
export const CategoriesSectionSuspense = ({categoryId}:CategoriesSectionProps) => {
  const router=useRouter();
  //we are now immediately going to access the cache which we have,thanks to this prefetch in our server component 
  const [categories]=trpc.categories.getMany.useSuspenseQuery()
  const data=categories.map(({name,id})=>({
    value:id,
    label:name
  }));
  const onSelect=(value:string|null)=>{
      const url=new URL(window.location.href);
      if(value){
        url.searchParams.set("categoryId",value);
      }else{
        url.searchParams.delete("categoryId")
  }
    router.push(url.toString())
}
  return <FilterCarousel onSelect={onSelect} value={categoryId} data={data}/>
}

```

### src/modules/search/ui/sections/results-section.tsx

```tsx
"use client";

import { DEFAULT_LIMIT } from "@/constants";
import { useIsMobile } from "@/hooks/use-mobile";
import { trpc } from "@/trpc/client";
import { InfiniteScroll } from "@/components/infinite-scroll";
import { SortFilter } from "../components/sort-filter";
import { useSearchParams } from "next/navigation";
import { VideoGridCard } from "@/modules/videos /ui/components/video-grid-card";
import { VideoRowCard } from "@/modules/videos /ui/components/video-row-card";
import { UserResults } from "./user-results";

interface ResultsSectionProps {
  query: string | undefined;
  categoryId: string | undefined;
}

export const ResultsSection = ({
  query,
  categoryId,
}: ResultsSectionProps) => {
  const isMobile = useIsMobile();
  const searchParams = useSearchParams();
  
  // 获取排序参数，默认为 "default"
  const sortBy = searchParams.get("sort") || "default";
  
  const [results, resultQuery] = trpc.search.getMany.useSuspenseInfiniteQuery(
    { 
      query, 
      categoryId, 
      limit: DEFAULT_LIMIT,
      sortBy: sortBy as "default" | "views"
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );
  
  const videos = results.pages.flatMap((page) => page.items);
  const hasVideos = videos.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">
          {query ? `Latest from "${query}"` : "Search Results"}
        </h2>
        
        {/* 添加筛选器按钮 */}
        <SortFilter />
      </div>
            
      {/* 显示用户搜索结果（仅在搜索查询存在时） */}
      {query && <UserResults query={query} />}

      {/* 默认显示搜索结果 */}
      {hasVideos ? (
        <>
          <div className={isMobile ? "flex flex-col gap-y-10" : "flex flex-col gap-4"}>
            {videos.map((video) =>
              isMobile ? (
                <VideoGridCard key={video.id} data={video} />
              ) : (
                <VideoRowCard key={video.id} data={video} />
              )
            )}
          </div>
          
          <InfiniteScroll
            hasNextPage={resultQuery.hasNextPage}
            isFetchingNextPage={resultQuery.isFetchingNextPage}
            fetchNextPage={resultQuery.fetchNextPage}
          />
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No matching content found</p>
        </div>
      )}
    </div>
  );
};
```

### src/modules/search/ui/components/sort-filter.tsx

```tsx
"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FilterIcon } from "lucide-react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";

export const SortFilter = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
    // 获取当前排序参数，默认为 "default"
    const currentSort = searchParams.get("sort") || "default";
  
    const handleSortChange = (sortBy: string) => {
      const params = new URLSearchParams(searchParams);
      
      // 设置排序参数
      params.set("sort", sortBy);
      
      // 导航到新URL
      router.replace(`${pathname}?${params.toString()}`);
    };

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <FilterIcon className="size-4" />
            Filter
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem 
            className={currentSort === "default" ? "bg-accent" : ""}
            onClick={() => handleSortChange("default")}
          >
            Default
          </DropdownMenuItem>
          <DropdownMenuItem 
            className={currentSort === "views" ? "bg-accent" : ""}
            onClick={() => handleSortChange("views")}
          >
            Views
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };
  
```

### src/modules/search/ui/sections/user-section.tsx

```tsx
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { trpc } from "@/trpc/client";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

interface UserResultsProps {
  query: string;
}

export const UserResults = ({ query }: UserResultsProps) => {
  const { data, isLoading } = trpc.search.getUsers.useQuery({ query });
  
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 mt-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-2">
            <Skeleton className="h-12 w-12 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    );
  }

  if (!data?.items?.length) return null;

  return (
    <div className="mt-6">
      <h3 className="text-xl font-semibold mb-4">Relevant user</h3>
      <div className="flex flex-col gap-2">
        {data.items.map((user) => (
          <Link 
            key={user.id} 
            href={`/users/${user.id}`}
            className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Avatar>
              <AvatarImage src={user.avatar || ""} className="object-cover" />
              <AvatarFallback className="bg-gray-200">
                {user.username?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium">{user.username}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};
```

## create search procedure

### src/modules/search/server/procedures.ts

```tsx
import { db } from "@/db";
import { users, videoReactions, videoViews, videos } from "@/db/schema";
import { z } from 'zod';
import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import { and, eq, or, lt, desc, ilike, getTableColumns, count } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

export const searchRouter = createTRPCRouter({
  getMany: baseProcedure
    .input(
      z.object({
        query: z.string().nullish(),
        categoryId: z.string().uuid().nullish(),
        sortBy: z.enum(["default", "views"]).default("default"),
        cursor: z.object({
          id: z.string().uuid(),
          updatedAt: z.date(),
        }).nullish(),
        limit: z.number().min(1).max(100),
      })
    )
    .query(async ({ input }) => {
      const { cursor, limit, query, categoryId, sortBy } = input;
      
      // 为聚合字段创建别名
      const viewCountAlias = alias(videoViews, "view_count_alias");
      const likeCountAlias = alias(videoReactions, "like_count_alias");
      const dislikeCountAlias = alias(videoReactions, "dislike_count_alias");
      
      const baseQuery = db
        .select({
          ...getTableColumns(videos),
          user: users,
          viewCount: count(viewCountAlias).as("viewCount"),
          likeCount: count(likeCountAlias).mapWith(Number).as("likeCount"),
          dislikeCount: count(dislikeCountAlias).mapWith(Number).as("dislikeCount"),
        })
        .from(videos)
        .innerJoin(users, eq(videos.userId, users.id))
        .leftJoin(viewCountAlias, eq(viewCountAlias.videoId, videos.id))
        .leftJoin(
          likeCountAlias,
          and(
            eq(likeCountAlias.videoId, videos.id),
            eq(likeCountAlias.type, "like")
          )
        )
        .leftJoin(
          dislikeCountAlias,
          and(
            eq(dislikeCountAlias.videoId, videos.id),
            eq(dislikeCountAlias.type, "dislike")
          )
        )
        .where(and(
          eq(videos.visibility, "public"),
          query ? or(
            ilike(videos.title, `%${query}%`),
            ilike(videos.description, `%${query}%`)
          ) : undefined,
          categoryId ? eq(videos.categoryId, categoryId) : undefined
        ))
        .groupBy(videos.id, users.id);

      // 根据排序参数添加排序
      let orderedQuery;
      if (sortBy === "views") {
        orderedQuery = baseQuery.orderBy(
          desc(count(viewCountAlias)),
          desc(videos.updatedAt),
          desc(videos.id)
        );
      } else {
        orderedQuery = baseQuery.orderBy(
          desc(videos.updatedAt),
          desc(videos.id)
        );
      }

      // 添加游标分页
      if (cursor) {
        orderedQuery = orderedQuery.having(or(
          lt(videos.updatedAt, cursor.updatedAt),
          and(
            eq(videos.updatedAt, cursor.updatedAt),
            lt(videos.id, cursor.id)
          )
        ));
      }

      // 执行查询
      const result = await orderedQuery.limit(limit + 1);
      
      const data = result.map(row => ({
        ...row,
        viewCount: row.viewCount ?? 0,
        likeCount: row.likeCount ?? 0,
        dislikeCount: row.dislikeCount ?? 0,
      }));

      const hasMore = data.length > limit;
      const items = hasMore ? data.slice(0, -1) : data;
      const lastItem = items[items.length - 1];
      const nextCursor = hasMore && lastItem
        ? { id: lastItem.id, updatedAt: lastItem.updatedAt }
        : null;

      return {
        items,
        nextCursor
      };
    }),

  // 用户搜索过程保持不变
  getUsers: baseProcedure
    .input(
      z.object({
        query: z.string().nullish(),
        limit: z.number().min(1).max(20).default(10),
      })
    )
    .query(async ({ input }) => {
      const { query, limit } = input;
      
      if (!query) return { items: [] };

      const data = await db
        .select({
          id: users.id,
          username: users.name,
          avatar: users.imageUrl,
        })
        .from(users)
        .where(or(
          ilike(users.name, `%${query}%`),
        ))
        .limit(limit);

      return {
        items: data,
      };
    }),
});
```

### src/trpc/routers/_app.ts

```ts
 search:searchRouter,
```

# Chapter 27 Home Feed

![image-20250809225436598](/Users/a1/Library/Application Support/typora-user-images/image-20250809225436598.png)

## Requirements

Home video section display all the videos(desc by videos.updatedAt,and videos.id)

in sidebar,we add tredning and subscription part

in trednding part we will display the videos list accroding to video's viewCount

in subscription part ,we will display the user's subscribed user's videos.

## Workflow

![image-20250809232128768](/Users/a1/Library/Application Support/typora-user-images/image-20250809232128768.png)

## Create videos procedures

### src/modules/videos/server/procedure.ts

```ts
getMany:baseProcedure
    .input(
      z.object({   
        categoryId:z.string().uuid().nullish(),
        cursor:z.object({
          id:z.string().uuid(),
          updatedAt:z.date(),
        })
        .nullish(),
        limit:z.number().min(1).max(100),
      })
    )
    .query(async({input})=>{
      const {cursor,limit,categoryId}=input;
      const data=await db
        .select({
          ...getTableColumns(videos),
          user:users,
          viewCount:db.$count(videoViews,eq(videoViews.videoId,videos.id)),
          likeCount:db.$count(videoReactions,and(
            eq(videoReactions.videoId,videos.id),
            eq(videoReactions.type,"like"),
            )),
          dislikeCount:db.$count(videoReactions,and(
            eq(videoReactions.videoId,videos.id),
            eq(videoReactions.type,"dislike"),
            )), 
        })
        .from(videos)
        .innerJoin(users,eq(videos.userId,users.id))
        .where(and(
          eq(videos.visibility,"public"),
          categoryId ? eq(videos.categoryId,categoryId):undefined,
          cursor
            ? or(
              lt(videos.updatedAt,cursor.updatedAt),
              and(
                eq(videos.updatedAt,cursor.updatedAt),
                lt(videos.id,cursor.id)
              ))
            :undefined,
          )).orderBy(desc(videos.updatedAt),desc(videos.id))
          // Add 1 to the limit to check if there is more data
          .limit(limit+1)
          const hasMore=data.length >limit
          //remove the last item if there is more data
          const items=hasMore ?data.slice(0,-1):data
          //set the next cursor to the last item if there is more data
          const lastItem=items[items.length-1];
          const nextCursor=hasMore ?
            {
              id:lastItem.id,
              updatedAt:lastItem.updatedAt
            }:null;
        return {
          items,
          nextCursor
        };
    }),
```

### src/app/(home)/page.tsx

```tsx
void trpc.videos.getMany.prefetchInfinite({categoryId,limit:DEFAULT_LIMIT})
```

## Add Home page

### src/modules/home/ui/views/home-view.tsx

```tsx
import React from 'react'
import { CategoriesSection } from '../sections/categories-section';
import { HomeVideoSection } from '../sections/home-video-section';
interface HomeViewProps{
  categoryId?:string;
}

export const HomeView = ({categoryId}:HomeViewProps) => {
  return (
    <div className="max-w-[2400px] mx-auto mb-10 px-4 pt-2.5 flex flex-col gap-y-6 ">
      <CategoriesSection categoryId={categoryId}/>
      <HomeVideoSection categoryId={categoryId}/>
    </div>  
  )
}

```

### src/modules/home/ui/sections/home-video-section.tsx

```tsx
"use client"
import { DEFAULT_LIMIT } from "@/constants";
import { VideoGridCard } from "@/modules/videos /ui/components/video-grid-card";
import { trpc } from "@/trpc/client";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

interface HomeVideosSectionProps{
  categoryId?:string;
}
export const HomeVideoSection=(props:HomeVideosSectionProps)=>{
  return(
    <Suspense key={props.categoryId} fallback={<HomeVideoSectionSkeleton/>}>
    <ErrorBoundary fallback={<p>Error</p>}>
      <HomeVideoSectionSuspense {...props}/>
    </ErrorBoundary>
  </Suspense>
  )
}

const HomeVideoSectionSkeleton=()=>{
  return (
    <div>
      Loading
    </div>
  )
}

const HomeVideoSectionSuspense=({categoryId}:HomeVideosSectionProps)=>{
  const [videos,query] =trpc.videos.getMany.useSuspenseInfiniteQuery(
    {categoryId,limit:DEFAULT_LIMIT},
  {
    getNextPageParam:(lastPage)=>lastPage.nextCursor,
  }
  );

  return(
    <div>
      <div className="gap-4 gap-y-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 [@media(min-width:1920px)]:grid-cols-5">
        {videos.pages
          .flatMap((page)=>page.items)
          .map((video)=>(
            <VideoGridCard key={video.id} data={video}/>
          ))
          }
      </div>
    </div>
  )
  
}
```

## Add Trending page

### Create src/app/(home)/feed/trending/page.tsx

```tsx
import { DEFAULT_LIMIT } from '@/constants';
import { TrendingView } from '@/modules/home/ui/views/trending-view';
import { HydrateClient, trpc } from '@/trpc/server'
import React from 'react'
export const dynamic ="force-dynamic";



const Page =() => {
 
  void trpc.videos.getTrending.prefetchInfinite({limit:DEFAULT_LIMIT})
  return (
    <HydrateClient>
      <TrendingView/>
    </HydrateClient>
  )
}

export default Page;
```

### src/modules/videos/server/procedures.ts

```ts
getTrending:baseProcedure
    .input(
      z.object({  
        cursor:z.object({
          id:z.string().uuid(),
          viewCount:z.number(),
        })
        .nullish(),
        limit:z.number().min(1).max(100),
      })
    )
    .query(async({input})=>{
      const {cursor,limit}=input;
      const viewCountSubquery=db.$count(
        videoViews,
        eq(videoViews.videoId,videos.id)
      )
      const data=await db
        .select({
          ...getTableColumns(videos),
          user:users,
          /* when it's in a constant,it will allow us to do some ordering by that subqueryre */
          viewCount:viewCountSubquery,
          likeCount:db.$count(videoReactions,and(
            eq(videoReactions.videoId,videos.id),
            eq(videoReactions.type,"like"),
            )),
          dislikeCount:db.$count(videoReactions,and(
            eq(videoReactions.videoId,videos.id),
            eq(videoReactions.type,"dislike"),
            )), 
        })
        .from(videos)
        .innerJoin(users,eq(videos.userId,users.id))
        .where(and(
          eq(videos.visibility,"public"),
          cursor
            ? or(
              lt(viewCountSubquery,cursor.viewCount),
              and(
                eq(viewCountSubquery,cursor.viewCount),
                lt(videos.id,cursor.id)
              ))
            :undefined,
          )).orderBy(desc(viewCountSubquery),desc(videos.id))
          // Add 1 to the limit to check if there is more data
          .limit(limit+1)
          const hasMore=data.length >limit
          //remove the last item if there is more data
          const items=hasMore ?data.slice(0,-1):data
          //set the next cursor to the last item if there is more data
          const lastItem=items[items.length-1];
          const nextCursor=hasMore ?
            {
              id:lastItem.id,
              viewCount:lastItem.viewCount
            }:null;
        return {
          items,
          nextCursor
        };
    }),  
```

### src/modules/home/ui/views/trending-view.tsx

```tsx
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
```

### src/modules/home/ui/sections/trending-video-section.tsx

```tsx
"use client"
import { InfiniteScroll } from "@/components/infinite-scroll";
import { DEFAULT_LIMIT } from "@/constants";
import { VideoGridCard, VideoGridCardSkeleton } from "@/modules/videos /ui/components/video-grid-card";
import { trpc } from "@/trpc/client";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";


export const TrendingVideoSection=()=>{
  return(
    <Suspense fallback={<TrendingVideoSectionSkeleton/>}>
    <ErrorBoundary fallback={<p>Error</p>}>
      <TrendingVideoSectionSuspense/>
    </ErrorBoundary>
  </Suspense>
  )
}

const TrendingVideoSectionSkeleton=()=>{
  return (
    <div className="gap-4 gap-y-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 [@media(min-width:1920px)]:grid-cols-5 [@media(min-width:2200px)]:grid-cols-6" >
        {Array.from({length:18}).map((_,index)=>(
            <VideoGridCardSkeleton key={index} />
          ))
          }
      </div>
  )
}

const TrendingVideoSectionSuspense=()=>{
  const [videos,query] =trpc.videos.getTrending.useSuspenseInfiniteQuery(
    {limit:DEFAULT_LIMIT},
  {
    getNextPageParam:(lastPage)=>lastPage.nextCursor,
  }
  );

  return(
    <div>
      <div className="gap-4 gap-y-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 [@media(min-width:1920px)]:grid-cols-5 [@media(min-width:2200px)]:grid-cols-6" >
        {videos.pages
          .flatMap((page)=>page.items)
          .map((video)=>(
            <VideoGridCard key={video.id} data={video}/>
          ))
          }
      </div>
      <InfiniteScroll
      hasNextPage={query.hasNextPage}
      isFetchingNextPage={query.isFetchingNextPage}
      fetchNextPage={query.fetchNextPage}
      />
    </div>
  )
  
}
```

## Add Subscriptions page

### src/modules/videos/server/procedures.ts

```ts
getManySubscribed:protectedProcedure
    .input(
      z.object({   
        cursor:z.object({
          id:z.string().uuid(),
          updatedAt:z.date(),
        })
        .nullish(),
        limit:z.number().min(1).max(100),
      })
    )
    .query(async({ctx,input})=>{
      const {id:userId}=ctx.user;
      const {cursor,limit}=input;

      const viewerSubscription=db.$with("viewer_subscriptions").as(
          db
            .select({
              userId:subscriptions.creatorId,
            })
            .from(subscriptions)
            .where(eq(subscriptions.viewerId,userId))
      )

      const data=await db
      	.with(viewerSubscription) 
        .select({
          ...getTableColumns(videos),
          user:users,
          viewCount:db.$count(videoViews,eq(videoViews.videoId,videos.id)),
          likeCount:db.$count(videoReactions,and(
            eq(videoReactions.videoId,videos.id),
            eq(videoReactions.type,"like"),
            )),
          dislikeCount:db.$count(videoReactions,and(
            eq(videoReactions.videoId,videos.id),
            eq(videoReactions.type,"dislike"),
            )), 
        })
        .from(videos)
        .innerJoin(users,eq(videos.userId,users.id))
        .innerJoin(
          viewerSubscription,
          eq(viewerSubscription.userId,users.id)
        )
        .where(and(
          eq(videos.visibility,"public"),
          cursor
            ? or(
              lt(videos.updatedAt,cursor.updatedAt),
              and(
                eq(videos.updatedAt,cursor.updatedAt),
                lt(videos.id,cursor.id)
              ))
            :undefined,
          )).orderBy(desc(videos.updatedAt),desc(videos.id))
          // Add 1 to the limit to check if there is more data
          .limit(limit+1)
          const hasMore=data.length >limit
          //remove the last item if there is more data
          const items=hasMore ?data.slice(0,-1):data
          //set the next cursor to the last item if there is more data
          const lastItem=items[items.length-1];
          const nextCursor=hasMore ?
            {
              id:lastItem.id,
              updatedAt:lastItem.updatedAt
            }:null;
        return {
          items,
          nextCursor
        };
    }),
```

### create src/modules/home/ui/views/subscribed-view.tsx

```tsx
import React from 'react'
import { TrendingVideoSection } from '../sections/trending-video-section';


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
```

### create src/modules/home/ui/sections/subscribed-video-section.tsx

```tsx
"use client"
import { InfiniteScroll } from "@/components/infinite-scroll";
import { DEFAULT_LIMIT } from "@/constants";
import { VideoGridCard, VideoGridCardSkeleton } from "@/modules/videos /ui/components/video-grid-card";
import { VideoRowCard, VideoRowCardSkeleton } from "@/modules/videos /ui/components/video-row-card";
import { trpc } from "@/trpc/client";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";


export const SubscribedVideoSection=()=>{
  return(
    <Suspense fallback={<SubscribedVideoSectionSkeleton/>}>
    <ErrorBoundary fallback={<p>Error</p>}>
      <SubscribedVideoSectionSuspense/>
    </ErrorBoundary>
  </Suspense>
  )
}

const SubscribedVideoSectionSkeleton=()=>{
  return (
    <div className="gap-4 gap-y-5 flex flex-col " >
        {Array.from({length:18}).map((_,index)=>(
            <VideoRowCardSkeleton key={index} />
          ))
          }
      </div>
  )
}

const SubscribedVideoSectionSuspense=()=>{
  const [videos,query] =trpc.videos.getManySubscribed.useSuspenseInfiniteQuery(
    {limit:DEFAULT_LIMIT},
  {
    getNextPageParam:(lastPage)=>lastPage.nextCursor,
  }
  );

  return(
    <div>
      <div className="gap-2 gap-y-2 flex flex-col " >
        {videos.pages
          .flatMap((page)=>page.items)
          .map((video)=>(
            <VideoRowCard key={video.id} data={video}/>
          ))
          }
      </div>
      <InfiniteScroll
      hasNextPage={query.hasNextPage}
      isFetchingNextPage={query.isFetchingNextPage}
      fetchNextPage={query.fetchNextPage}
      />
    </div>
  )  
}
```

### create src/app/(home)/feed/subscriptions/page.tsx

```tsx
import { DEFAULT_LIMIT } from '@/constants';
import { SubscribedView } from '@/modules/home/ui/views/subscribed-view';
import { HydrateClient, trpc } from '@/trpc/server'
import React from 'react'
export const dynamic ="force-dynamic";

const Page =() => {
 
  void trpc.videos.getManySubscribed.prefetchInfinite({limit:DEFAULT_LIMIT})
  return (
    <HydrateClient>
      <SubscribedView/>
    </HydrateClient>
  )
}

export default Page;
```



Immediately without refresh subscribed and unsubscribe ,it should be available 

### src/modules/subscriptions/hooks/use-subscription.ts

```ts
const subscribe=trpc.subscriptions.create.useMutation({
    onSuccess:()=>{
      toast.success("Subscribed");
      //TODO:reinvalidate subscriptions.getMany ,users.getOne
      utils.videos.getManySubscribed.invalidate();
      
      

const unsubscribe=trpc.subscriptions.remove.useMutation({
    onSuccess:()=>{
      toast.success("unsubscribed");
      //TODO:reinvalidate subscriptions.getMany ,users.getOne
      utils.videos.getManySubscribed.invalidate();
```

# Chapter 28 History and Liked Playlist

## Requirements

Display the watched videos and liked videos list

## Workflow

![image-20250810191149570](/Users/a1/Library/Application Support/typora-user-images/image-20250810191149570.png)

## Create playlist procedures

### src/modules/playlists/server/procedures.ts

```ts
import { db} from "@/db";
import { users, videoReactions, videoViews, videos } from "@/db/schema";
import {z} from 'zod';
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { eq,and,or,lt,desc,getTableColumns,} from "drizzle-orm";


  export const playlistsRouter=createTRPCRouter({ 
  getHistory:protectedProcedure
    .input(
      z.object({   
        cursor:z.object({
          id:z.string().uuid(),
          viewedAt:z.date(),
        })
        .nullish(),
        limit:z.number().min(1).max(100),
      })
    )
    .query(async({ctx,input})=>{
      const {id:userId}=ctx.user;
      const {cursor,limit}=input;

      const viewerVideoViews=db.$with("viewer_video_views").as(
        db
          .select({
            videoId:videoViews.videoId,
            viewedAt:videoViews.updatedAt,
          })
          .from(videoViews)
          .where(eq(videoViews.userId,userId))
      )

      const data=await db
        .with(viewerVideoViews)  
        .select({
          ...getTableColumns(videos),
          user:users,
          viewedAt:viewerVideoViews.viewedAt,
          viewCount:db.$count(videoViews,eq(videoViews.videoId,videos.id)),
          likeCount:db.$count(videoReactions,and(
            eq(videoReactions.videoId,videos.id),
            eq(videoReactions.type,"like"),
            )),
          dislikeCount:db.$count(videoReactions,and(
            eq(videoReactions.videoId,videos.id),
            eq(videoReactions.type,"dislike"),
            )), 
        })
        .from(videos)
        .innerJoin(users,eq(videos.userId,users.id))
        .innerJoin(viewerVideoViews,eq(videos.id,viewerVideoViews.videoId))
        .where(and(
          eq(videos.visibility,"public"),
          cursor
            ? or(
              lt(viewerVideoViews.viewedAt,cursor.viewedAt),
              and(
                eq(viewerVideoViews.viewedAt,cursor.viewedAt),
                lt(videos.id,cursor.id)
              ))
            :undefined,
          )).orderBy(desc(viewerVideoViews.viewedAt),desc(videos.id))
          // Add 1 to the limit to check if there is more data
          .limit(limit+1)
          const hasMore=data.length >limit
          //remove the last item if there is more data
          const items=hasMore ?data.slice(0,-1):data
          //set the next cursor to the last item if there is more data
          const lastItem=items[items.length-1];
          const nextCursor=hasMore ?
            {
              id:lastItem.id,
              viewedAt:lastItem.viewedAt
            }:null;
        return {
          items,
          nextCursor
        };
    }),
});
```

### src/trpc/routers/_app.ts

```ts
 playlists:playlistsRouter,
```

### src/app/(home)/playlists/history/page.tsx

```tsx
import { DEFAULT_LIMIT } from '@/constants'
import { HistoryView } from '@/modules/playlists/ui/views/history-view'
import { HydrateClient, trpc } from '@/trpc/server'
import React from 'react'

const Page = () => {
  void trpc.playlists.getHistory.prefetchInfinite({limit:DEFAULT_LIMIT})
  return (
    <HydrateClient>
      <HistoryView/>
    </HydrateClient>
  )
}

export default Page
```

### src/modules/playlists/ui/views/history-view.tsx

```tsx
import React from 'react'
import { HistoryVideoSection } from '../sections/history-videos-section'



export const HistoryView = () => {
  return (
    /* 设置元素的最大宽度为 中等屏幕宽度（medium screen），即 768px。 */
    <div className="max-w-screen-md mx-auto mb-10 px-4 pt-2.5 flex flex-col gap-y-6  ">
     <div>
      <h1 className="text-2xl font-bold">History</h1>
     </div>
     <p className="text-xs text-muted-foreground">
      Videos you have watched
     </p>
      <HistoryVideoSection/>
    </div>  
  )
}

```

### src/modules/playlists/ui/sections/history-videos-section.tsx

```tsx
"use client"
import { InfiniteScroll } from "@/components/infinite-scroll";
import { DEFAULT_LIMIT } from "@/constants";
import { VideoGridCard, VideoGridCardSkeleton } from "@/modules/videos /ui/components/video-grid-card";
import { VideoRowCard, VideoRowCardSkeleton } from "@/modules/videos /ui/components/video-row-card";
import { trpc } from "@/trpc/client";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";


export const HistoryVideoSection=()=>{
  return(
    <Suspense fallback={<HistoryVideoSectionSkeleton/>}>
    <ErrorBoundary fallback={<p>Error</p>}>
      <HistoryVideoSectionSuspense/>
    </ErrorBoundary>
  </Suspense>
  )
}

const HistoryVideoSectionSkeleton=()=>{
  return (
    <div>
      <div className="gap-2 gap-y-2 flex flex-col md:hidden" >
        {Array.from({length:18}).map((_,index)=>(
            <VideoGridCardSkeleton key={index} />
          ))
          }
      </div>
      <div className="gap-2 gap-y-2 hidden flex-col md:flex " >
        {Array.from({length:18}).map((_,index)=>(
            <VideoRowCardSkeleton key={index} size="compact"/>
          ))
          }
      </div>
    </div>
    
  )
}

const HistoryVideoSectionSuspense=()=>{
  const [videos,query] =trpc.playlists.getHistory.useSuspenseInfiniteQuery(
    {limit:DEFAULT_LIMIT},
  {
    getNextPageParam:(lastPage)=>lastPage.nextCursor,
  }
  );

  return(
    <div>
      <div className="gap-2 gap-y-2 flex flex-col md:hidden " >
        {videos.pages
          .flatMap((page)=>page.items)
          .map((video)=>(
            <VideoGridCard key={video.id} data={video}/>
          ))
          }
      </div>
      <div className="gap-2 gap-y-2 hidden flex-col md:flex " >
        {videos.pages
          .flatMap((page)=>page.items)
          .map((video)=>(
            <VideoRowCard key={video.id} data={video} size="compact"/>
          ))
          }
      </div>
      <InfiniteScroll
      hasNextPage={query.hasNextPage}
      isFetchingNextPage={query.isFetchingNextPage}
      fetchNextPage={query.fetchNextPage}
      />
    </div>
  )
  
}
```

### src/modules/playlists/server/procedures.ts

```ts
getLiked:protectedProcedure
    .input(
      z.object({   
        cursor:z.object({
          id:z.string().uuid(),
          likedAt:z.date(),
        })
        .nullish(),
        limit:z.number().min(1).max(100),
      })
    )
    .query(async({ctx,input})=>{
      const {id:userId}=ctx.user;
      const {cursor,limit}=input;

      const viewerVideoReactions=db.$with("viewer_video_reaction  s").as(
        db
          .select({
            videoId:videoReactions.videoId,
            likedAt:videoReactions.updatedAt,
          })
          .from(videoReactions)
          .where(and(
            eq(videoReactions.userId,userId),
            eq(videoReactions.type,"like")
          ))
      )

      const data=await db
        .with(viewerVideoReactions)  
        .select({
          ...getTableColumns(videos),
          user:users,
          likedAt:viewerVideoReactions.likedAt,
          viewCount:db.$count(videoViews,eq(videoViews.videoId,videos.id)),
          likeCount:db.$count(videoReactions,and(
            eq(videoReactions.videoId,videos.id),
            eq(videoReactions.type,"like"),
            )),
          dislikeCount:db.$count(videoReactions,and(
            eq(videoReactions.videoId,videos.id),
            eq(videoReactions.type,"dislike"),
            )), 
        })
        .from(videos)
        .innerJoin(users,eq(videos.userId,users.id))
        .innerJoin(viewerVideoReactions,eq(videos.id,viewerVideoReactions.videoId))
        .where(and(
          eq(videos.visibility,"public"),
          cursor
            ? or(
              lt(viewerVideoReactions.likedAt,cursor.likedAt),
              and(
                eq(viewerVideoReactions.likedAt,cursor.likedAt),
                lt(videos.id,cursor.id)
              ))
            :undefined,
          )).orderBy(desc(viewerVideoReactions.likedAt),desc(videos.id))
          // Add 1 to the limit to check if there is more data
          .limit(limit+1)
          const hasMore=data.length >limit
          //remove the last item if there is more data
          const items=hasMore ?data.slice(0,-1):data
          //set the next cursor to the last item if there is more data
          const lastItem=items[items.length-1];
          const nextCursor=hasMore ?
            {
              id:lastItem.id,
              likedAt:lastItem.likedAt
            }:null;
        return {
          items,
          nextCursor
        };
    }),  
```

### src/app/(home)/playlists/liked/page.tsx

```tsx
import { DEFAULT_LIMIT } from '@/constants'
import { LikedView } from '@/modules/playlists/ui/views/liked-view'
import { HydrateClient, trpc } from '@/trpc/server'
import React from 'react'

const Page = () => {
  void trpc.playlists.getLiked.prefetchInfinite({limit:DEFAULT_LIMIT})
  return (
    <HydrateClient>
      <LikedView/>
    </HydrateClient>
  )
}

export default Page
```

### src/modules/playlists/ui/views/liked-view.tsx

```tsx
import React from 'react'
import { LikedVideoSection } from '../sections/liked-video-section'



export const LikedView = () => {
  return (
    /* 设置元素的最大宽度为 中等屏幕宽度（medium screen），即 768px。 */
    <div className="max-w-screen-md mx-auto mb-10 px-4 pt-2.5 flex flex-col gap-y-6  ">
     <div>
      <h1 className="text-2xl font-bold">Liked</h1>
     </div>
     <p className="text-xs text-muted-foreground">
      Videos you have liked
     </p>
      <LikedVideoSection/>
    </div>  
  )
}
```

### src/modules/playlists/ui/sections/liked-video-section.tsx

```tsx
"use client"
import { InfiniteScroll } from "@/components/infinite-scroll";
import { DEFAULT_LIMIT } from "@/constants";
import { VideoGridCard, VideoGridCardSkeleton } from "@/modules/videos /ui/components/video-grid-card";
import { VideoRowCard, VideoRowCardSkeleton } from "@/modules/videos /ui/components/video-row-card";
import { trpc } from "@/trpc/client";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";


export const LikedVideoSection=()=>{
  return(
    <Suspense fallback={<LikedVideoSectionSkeleton/>}>
    <ErrorBoundary fallback={<p>Error</p>}>
      <LikedVideoSectionSuspense/>
    </ErrorBoundary>
  </Suspense>
  )
}

const LikedVideoSectionSkeleton=()=>{
  return (
    <div>
      <div className="gap-2 gap-y-2 flex flex-col md:hidden" >
        {Array.from({length:18}).map((_,index)=>(
            <VideoGridCardSkeleton key={index} />
          ))
          }
      </div>
      <div className="gap-2 gap-y-2 hidden flex-col md:flex " >
        {Array.from({length:18}).map((_,index)=>(
            <VideoRowCardSkeleton key={index} size="compact"/>
          ))
          }
      </div>
    </div>
    
  )
}

const LikedVideoSectionSuspense=()=>{
  const [videos,query] =trpc.playlists.getLiked.useSuspenseInfiniteQuery(
    {limit:DEFAULT_LIMIT},
  {
    getNextPageParam:(lastPage)=>lastPage.nextCursor,
  }
  );

  return(
    <div>
      <div className="gap-2 gap-y-2 flex flex-col md:hidden " >
        {videos.pages
          .flatMap((page)=>page.items)
          .map((video)=>(
            <VideoGridCard key={video.id} data={video}/>
          ))
          }
      </div>
      <div className="gap-2 gap-y-2 hidden flex-col md:flex " >
        {videos.pages
          .flatMap((page)=>page.items)
          .map((video)=>(
            <VideoRowCard key={video.id} data={video} size="compact"/>
          ))
          }
      </div>
      <InfiniteScroll
      hasNextPage={query.hasNextPage}
      isFetchingNextPage={query.isFetchingNextPage}
      fetchNextPage={query.fetchNextPage}
      />
    </div>
  ) 
}
```

### src/modules/videos/ui/components/video-reaction.tsx

```tsx
const like=trpc.videoReactions.like.useMutation({
    onSuccess:()=>{
      utils.videos.getOne.invalidate({id:videoId})
      //TODO:Invalidate "liked" playlist
      utils.playlists.getLiked.invalidate();
    },
    
    
const dislike=trpc.videoReactions.dislike.useMutation(
    {
      onSuccess:()=>{
        utils.videos.getOne.invalidate({id:videoId})
        //TODO:Invalidate "liked" playlist
        utils.playlists.getLiked.invalidate();
      },    
```

one thing I would like to do is to keep my tab highlighted while I'm in a specific part of my app

### src/modules/home/ui/components/home-sidebar/main-section.tsx

```tsx
const pathname=usePathname();
<SidebarMenuButton
isActive={pathname===item.url}//TODO:Change to look at current 
>

</SidebarMenuButton> 
```

### src/modules/home/ui/components/home-sidebar/personal-section.tsx

```tsx
const pathname=usePathname();
<SidebarMenuButton
isActive={pathname===item.url}//TODO:Change to look at current 
>

</SidebarMenuButton> 
```

# Chapter 29 Custom Playlist

## Requirements

when I click the plus button , it will alert a form that I can create a custom playlist ,I can give it a name and after I clicked the create button ,the form disappear and the palylist that I have created will appear in this page,the playlist position in grid and display playlist name,videos count and a view full playlist button, after I clicked this button ,it will display the video list

## Workflow

![image-20250810202001754](/Users/a1/Library/Application Support/typora-user-images/image-20250810202001754.png)

![image-20250810202019119](/Users/a1/Library/Application Support/typora-user-images/image-20250810202019119.png)

![image-20250810202128923](/Users/a1/Library/Application Support/typora-user-images/image-20250810202128923.png)

![image-20250810202152367](/Users/a1/Library/Application Support/typora-user-images/image-20250810202152367.png)

![image-20250810202209195](/Users/a1/Library/Application Support/typora-user-images/image-20250810202209195.png)

![image-20250810202249407](/Users/a1/Library/Application Support/typora-user-images/image-20250810202249407.png)

## Create playlists schema

## src/db/schema.ts

```ts
export const userRelations=relations(users,({many})=>({
  playlists:many(playlists),
}))

export const videoRelations=relations(videos,({one,many})=>({
   playlistVideos:many(playlistVideos),
}))

export const playlistVideos=pgTable("playlist_videos",{
    playlistId:uuid("playlist_id").references(()=>playlists.id,{onDelete:"cascade"}).notNull(),
    videoId:uuid("video_id").references(()=>videos.id,{onDelete:"cascade"}).notNull(),
    createdAt:timestamp("created_at").defaultNow().notNull(),
    updatedAt:timestamp("updated_at").defaultNow().notNull(),
  },(t)=>[
    primaryKey({
      name:"playlist_videos_pk",
      columns:[t.playlistId,t.videoId],
    }),
  ])

  export const playlistVideoRelations=relations(playlistVideos,({one})=>({
    playlist:one(playlists,{
      fields:[playlistVideos.playlistId],
      references:[playlists.id],
    }),
    video:one(videos,{
      fields:[playlistVideos.videoId],
      references:[videos.id],
    }),
  }))

  export const playlists=pgTable("playlists",{
    id:uuid("id").primaryKey().defaultRandom(),
    name:text("name").notNull(),
    description:text("description"),
    userId:uuid("user_id").references(()=>users.id,{onDelete:"cascade"}).notNull(),
    createdAt:timestamp("created_at").defaultNow().notNull(),
    updatedAt:timestamp("updated_at").defaultNow().notNull(),
  })

  export const playlistRelations=relations(playlists,({one,many})=>({
    user:one(users,{
      fields:[playlists.userId],
      references:[users.id],
    }),
    playlistVideos:many(playlistVideos),
  }))
```

## Create playlists procedures

### src/modules/playlists/server/procedures.ts

```ts
  create:protectedProcedure
      .input(z.object({name:z.string().min(1)}))
      .mutation(async({input,ctx})=>{
        const {name}=input;
        const {id:userId}=ctx.user;

        const [createdPlaylist]=await db
              .insert(playlists)
              .values({
                userId,
                name,
              })
              .returning();
            if(!createdPlaylist){
              throw new TRPCError({code:"BAD_REQUEST"})  
            }   
            return createdPlaylist;   
      }),
```

## Create playlists page

### src/app/(home)/playlists/page.tsx

```tsx
import { PlaylistsView } from '@/modules/playlists/ui/views/playlists-view';
import { HydrateClient } from '@/trpc/server';
import React from 'react'

const Page = async () => {
  return (
    <HydrateClient>
      <PlaylistsView/>
    </HydrateClient>
  )
}

export default Page;
```

### src/modules/playlists/ui/views/playlists-views.tsx

```tsx
"use client"
import { Button } from '@/components/ui/button'
import { PlusIcon } from 'lucide-react'
import React from 'react'



export const PlaylistsView = () => {
  return (
    /* 设置元素的最大宽度为 中等屏幕宽度（medium screen），即 768px。 */
    <div className="max-w-[2400px] mx-auto mb-10 px-4 pt-2.5 flex flex-col gap-y-6 ">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Playlist</h1>
          <p className="text-xs text-muted-foreground">
            Collections you have created
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full"
          onClick={()=>{}}
        >
          <PlusIcon/>
        </Button>
     </div>
    </div>  
  )
}
```

### src/modules/playlists/ui/components/playlist-create-modal.tsx

```tsx
import {z} from "zod";
import {toast} from "sonner";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {trpc} from "@/trpc/client";
import {Button} from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ResponsiveModal } from "@/components/responsive-dialog";
import{
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";


 interface PlaylistCreateModalProps{
  open:boolean; // 控制模态框显示/隐藏
  onOpenChange:(open:boolean)=>void;// 状态变更回调
 };
//表单验证模式
 const formSchema=z.object({
  name:z.string().min(1),//要求名称至少1个字符
 });

 export const PlaylistCreateModal=({
  open,
  onOpenChange,
 }:PlaylistCreateModalProps)=>{
  //表单初始化
  const form=useForm<z.infer<typeof formSchema>>({
    resolver:zodResolver(formSchema),// 集成Zod验证
    defaultValues:{ // 初始值
      name:""
    }
  });
	const utils=trpc.useUtils();
  //API 调用配置
  const create=trpc.playlists.create.useMutation({
    onSuccess:()=>{
      utils.playlists.getMany.invalidate();
      toast.success("Playlist created");
      form.reset();//重置表单
      onOpenChange(false);// 关闭模态框
    },
    onError:()=>{
      toast.error("Something went wrong")
    }
  });
  //提交处理函数。参数 values 就是表单中所有字段的当前值，自动根据你定义的 schema（formSchema）生成。
  const onSubmit=(values:z.infer<typeof formSchema>)=>{
    create.mutate(values)//// 调用tRPC mutation，发起请求
  };
  //UI渲染
  return (
    <ResponsiveModal
      title="Create a playlist"
      open={open}
      onOpenChange={onOpenChange}
    >
    {/* form 是通过 useForm() 初始化得到的，里面包含所有表单状态和方法。
      <Form {...form}> 会把这些状态提供给子组件（如 FormField、FormItem 等），方便嵌套使用。 */}
     <Form {...form}>
      <form 
      // 这里的 form.handleSubmit(onSubmit) 会自动：
      /* 监听 <form> 的提交事件；
        调用你传入的 onSubmit(values) 函数；
        参数 values 就是表单中所有字段的当前值，自动根据你定义的 schema（formSchema）生成。
        换句话说，用户一点击提交按钮，react-hook-form 会读取当前所有输入框的值，校验后打包成一个对象作为 values 传入你写的 onSubmit 函数。 */
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
      >
        <FormField
          control={form.control}
          name="name"
          //render={({field}) => ...}	渲染函数，field 包含所有绑定逻辑（例如 onChange、value）
          /* render 接收一个对象 { field }，这个 field 实际上是一个对象，包含：
            {
              name: 'name',
              value: 当前这个字段的值,
              onChange: (e) => 更新这个字段的值,
              onBlur: ...
              ref: ...
            } */
          render={({field})=>(
            <FormItem>
              <FormLabel>Create</FormLabel>
              {/* 这是一个封装了样式的容器，用来放实际的输入组件。 */}
              <FormControl>
                <Input
                /* ...field 让这个 <Input> 成为受控组件，自动联动 react-hook-form 的状态管理。这样就不需要手动写 onChange 或 value。 */
                  {...field}
                   placeholder="My favorite videos"  
                />
              </FormControl>
            </FormItem>
          )}
        />
        <div className="flex justify-end">
           <Button
            disabled={create.isPending}
            type="submit"
           >
            Create   
            </Button> 
        </div>
      </form>
     </Form>
    </ResponsiveModal>
  );
};

 
```

### src/modules/playlists/ui/views/playlists-views.tsx

```tsx
"use client"
import { Button } from '@/components/ui/button'
import { PlusIcon } from 'lucide-react'
import React, { useState } from 'react'
import { PlaylistCreateModal } from '../components/playlist-create-modal'



export const PlaylistsView = () => {
  const [createModalOpen,setCreateModalOpen]=useState(false)
  return (
    /* 设置元素的最大宽度为 中等屏幕宽度（medium screen），即 768px。 */
    <div className="max-w-[2400px] mx-auto mb-10 px-4 pt-2.5 flex flex-col gap-y-6 ">
        <PlaylistCreateModal
           open={createModalOpen}
           onOpenChange={setCreateModalOpen}
        />
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Playlist</h1>
          <p className="text-xs text-muted-foreground">
            Collections you have created
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full"
          onClick={()=>setCreateModalOpen(true)}
        >
          <PlusIcon/>
        </Button>
     </div>
    </div>  
  )
}

```

### src/modules/playlists/server/procedures.ts

```ts
getMany:protectedProcedure
    .input(
      z.object({   
        cursor:z.object({
          id:z.string().uuid(),
          updatedAt:z.date(),
        })
        .nullish(),
        limit:z.number().min(1).max(100),
      })
    )
    .query(async({ctx,input})=>{
      const {id:userId}=ctx.user;
      const {cursor,limit}=input;

      const data=await db
        .select({
          ...getTableColumns(playlists),
          videoCount:db.$count(
            playlistVideos,
            eq(playlists.id,playlistVideos.playlistId)
          ),
          user:users,
        })
        .from(playlists)
        .innerJoin(users,eq(playlists.userId,users.id))
        .where(and(
          eq(playlists.userId,userId),
          cursor
            ? or(
              lt(playlists.updatedAt,cursor.updatedAt),
              and(
                eq(playlists.updatedAt,cursor.updatedAt),
                lt(videos.id,cursor.id)
              ))
            :undefined,
          )).orderBy(desc(playlists.updatedAt),desc(playlists.id))
          // Add 1 to the limit to check if there is more data
          .limit(limit+1)
          const hasMore=data.length >limit
          //remove the last item if there is more data
          const items=hasMore ?data.slice(0,-1):data
          //set the next cursor to the last item if there is more data
          const lastItem=items[items.length-1];
          const nextCursor=hasMore ?
            {
              id:lastItem.id,
              updatedAt:lastItem.updatedAt,
            }:null;
        return {
          items,
          nextCursor
        };
    }),
```

### src/app/(home)/playlists/page.tsx

```tsx
 void trpc.playlists.getMany.prefetchInfinite({limit:DEFAULT_LIMIT})
```

### src/modules/playlists/ui/views/playlists-views.tsx

create  <PlaylistsSection/> component 

```tsx
"use client"
import { Button } from '@/components/ui/button'
import { PlusIcon } from 'lucide-react'
import React, { useState } from 'react'
import { PlaylistCreateModal } from '../components/playlist-create-modal'



export const PlaylistsView = () => {
  const [createModalOpen,setCreateModalOpen]=useState(false)
  return (
    /* 设置元素的最大宽度为 中等屏幕宽度（medium screen），即 768px。 */
    <div className="max-w-[2400px] mx-auto mb-10 px-4 pt-2.5 flex flex-col gap-y-6 ">
        <PlaylistCreateModal
           open={createModalOpen}
           onOpenChange={setCreateModalOpen}
        />
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Playlist</h1>
          <p className="text-xs text-muted-foreground">
            Collections you have created
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full"
          onClick={()=>setCreateModalOpen(true)}
        >
          <PlusIcon/>
        </Button>
     </div>
     <PlaylistsSection/>
    </div>  
  )
}
```

### create src/modules/playlists/ui/sections/playlists-section.tsx

```tsx
"use client"
import { InfiniteScroll } from "@/components/infinite-scroll";
import { DEFAULT_LIMIT } from "@/constants";
import { VideoGridCardSkeleton } from "@/modules/videos /ui/components/video-grid-card";
import { VideoRowCardSkeleton } from "@/modules/videos /ui/components/video-row-card";
import { trpc } from "@/trpc/client";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";


export const PlaylistsSection=()=>{
  return(
    <Suspense fallback={<PlaylistsSectionSkeleton/>}>
    <ErrorBoundary fallback={<p>Error</p>}>
      <PlaylistsSectionSuspense/>
    </ErrorBoundary>
  </Suspense>
  )
}

const PlaylistsSectionSkeleton=()=>{
  return (
    <div>
      <div className="gap-2 gap-y-2 flex flex-col md:hidden" >
        {Array.from({length:18}).map((_,index)=>(
            <VideoGridCardSkeleton key={index} />
          ))
          }
      </div>
      <div className="gap-2 gap-y-2 hidden flex-col md:flex " >
        {Array.from({length:18}).map((_,index)=>(
            <VideoRowCardSkeleton key={index} size="compact"/>
          ))
          }
      </div>
    </div>
    
  )
}

const PlaylistsSectionSuspense=()=>{
  const [playlists,query] =trpc.playlists.getMany.useSuspenseInfiniteQuery(
    {limit:DEFAULT_LIMIT},
  {
    getNextPageParam:(lastPage)=>lastPage.nextCursor,
  }
  );

  return(
    <div>
      <div className="gap-2 gap-y-2 flex flex-col " >
        {JSON.stringify(playlists)}
      </div>
      <InfiniteScroll
      hasNextPage={query.hasNextPage}
      isFetchingNextPage={query.isFetchingNextPage}
      fetchNextPage={query.fetchNextPage}
      />
    </div>
  )
  
}
```

###  src/modules/playlists/type.ts

```ts
import { AppRouter } from "@/trpc/routers/_app";
import {inferRouterOutputs} from "@trpc/server";

export type PlaylistGetManyOutput=
  inferRouterOutputs<AppRouter>["playlists"]["getMany"];
```

> ```ts
> inferRouterOutputs<AppRouter>["playlists"]["getMany"];
> ```
>
> **提取 tRPC 路由 `playlists.getMany` 的返回类型**。

### src/modules/playlists/ui/components/playlist-grid-card/index.tsx

```tsx
import { PlaylistGetManyOutput } from "@/modules/playlists/type";
import { THUMBNAIL_FALLBACK } from "@/modules/videos /constants";
import Link from "next/link";
import { PlaylistThumbnail } from "./playlist-thumbnail";

interface PlaylistGridCardProps{
  data:PlaylistGetManyOutput["items"][number]
}

export const PlaylistGridCard=({
  data,
}:PlaylistGridCardProps)=>{
  return(
    <Link href={`/playlists/${data.id}`}>
      <div className="flex flex-col gap-2 w-full group">
        <PlaylistThumbnail
          imageUrl={THUMBNAIL_FALLBACK}
          title={data.name}
          videoCount={data.videoCount}
          />
      </div>
    </Link>
  )
}
```

### create src/modules/playlists/ui/sections/playlists-section.tsx

```tsx
return(
   <div>
      <div className="gap-4 gap-y-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4
        [@media(min-width:1920px)]:grid-cols-5 [@media(min-width:2200px):grid-cols-6]" >
        {playlists.pages
            .flatMap((page)=>page.items)
            .map((playlist)=>(
              <PlaylistGridCard
                data={playlist}
                key={playlist.id}
              />
            ))
        }
```

### create src/modules/playlists/ui/components/playlist-grid-card/playlist-thumbnail.tsx

```tsx
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { THUMBNAIL_FALLBACK } from "@/modules/videos /constants";
import { Name } from "drizzle-orm";
import { ListVideoIcon, PlayIcon } from "lucide-react";
import Image from "next/image";
import { useMemo } from "react";

interface PlaylistThumbnailProps{
  title:string;
  videoCount:number;
  className?:string;
  imageUrl?:string | null;
};

export const PlaylistThumbnailSkeleton=()=>{
  return (
    <div className="relative w-full overflow-hidden rounded-xl aspect-video">
      <Skeleton className="size-full"/>
    </div>
  )
}

export const PlaylistThumbnail=({
  title,
  videoCount,
  className,
  imageUrl,
}:PlaylistThumbnailProps)=>{

  const compactViews=useMemo(()=>{
    return Intl.NumberFormat("en",{
      notation:"compact"
    }).format(videoCount)
  },[videoCount])

  return (
    // className这是一个外部传进来的自定义类名，可能是组件的 props：
    <div className={cn("relative pt-3 ",className)}>
      {/* Stack effect layers */}
      <div className="relative">
        {/* Background layers */}
        <div
          className="absolute -top-3 left-1/2 -translate-x-1/2 w-[97%] overflow-hidden rounded-xl bg-black/20 aspect-video"
        />
        <div
          className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-[98.5%] overflow-hidden rounded-xl bg-black/25 aspect-video"
        />
        {/* Main image */}
        <div className="relative overflow-hidden w-full rounded-xl aspect-video">
          <Image
            src={imageUrl || THUMBNAIL_FALLBACK}
            alt={title}
            className="w-full h-full object-over"
            /* fill 是它的一个布尔属性：让图片在父容器内填满整个空间，并且通过绝对定位方式来布局。 */
            fill
          />
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 
          transition-opacity flex items-center justify-center">
            <div className="flex items-center gap-x-2">
              <PlayIcon className="size-4 text-white fill-white"/>
              <span className="text-white font-medium">Play all</span>
            </div>
          </div>
        </div>
      </div>
      {/* Video count indicator */}
      <div className="absolute bottom-2 right-2 px-1 py-0.5 rounded bg-black/80 text-white text-xs 
      font-medium flex items-center gap-x-1">
        <ListVideoIcon className="size-4"/>
        {compactViews} videos
      </div>
    </div>
  )
 
}
```

### create src/modules/playlists/ui/components/playlist-grid-card/playlist-info.tsx

```tsx
import { Skeleton } from "@/components/ui/skeleton";
import { PlaylistGetManyOutput } from "../../../type";

interface PlaylistInfoProps{
  data:PlaylistGetManyOutput["items"][number]
}

export const PlaylistInfoSkeleton=()=>{
  return(
    <div className="flex gap-3">
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-5 w-[90%]"/>
        <Skeleton className="h-5 w-[70%]"/>
        <Skeleton className="h-5 w-[50%]"/>
      </div>
    </div>
  )
}

export const PlaylistInfo=({
  data,
}:PlaylistInfoProps)=>{
  return (
    <div className="flex gap-3">
      <div className="min-w-0 flex-1">
        <h3 className="font-medium line-clamp-1 lg:line-clamp-2 text-sm break-words">
          {data.name}
        </h3>
        <p className="text-sm text-muted-foreground">Playlist</p>
        <p className="text-sm text-muted-foreground font-semibold hover:text-primary">View full playlist</p>
      </div>
    </div>
  )
}
```

### src/modules/playlists/ui/components/playlist-grid-card/index.tsx

```tsx
import { PlaylistGetManyOutput } from "@/modules/playlists/type";
import { THUMBNAIL_FALLBACK } from "@/modules/videos /constants";
import Link from "next/link";
import { PlaylistThumbnail, PlaylistThumbnailSkeleton } from "./playlist-thumbnail";
import { PlaylistInfo, PlaylistInfoSkeleton } from "./playlist-info";

interface PlaylistGridCardProps{
  data:PlaylistGetManyOutput["items"][number]
}

export const PlaylistGridCardSkeleton=()=>{
   return(
    <div className="flex flex-col gap-2 w-full" >
      <PlaylistThumbnailSkeleton/>
      <PlaylistInfoSkeleton/>
    </div>
   ) 
}

export const PlaylistGridCard=({
  data,
}:PlaylistGridCardProps)=>{
  return(
    <Link href={`/playlists/${data.id}`}>
      <div className="flex flex-col gap-2 w-full group">
        <PlaylistThumbnail
          imageUrl={THUMBNAIL_FALLBACK}
          title={data.name}
          videoCount={data.videoCount}
          />
          <PlaylistInfo data={data}/>
      </div>
    </Link>
  )
}
```

### src/modules/playlists/ui/sections/playlists-section.tsx

```tsx
export const PlaylistsSection=()=>{
  return(
    <Suspense fallback={<PlaylistsSectionSkeleton/>}>
    <ErrorBoundary fallback={<p>Error</p>}>
      <PlaylistsSectionSuspense/>
    </ErrorBoundary>
  </Suspense>
  )
}



const PlaylistsSectionSkeleton=()=>{
  return (
    <div className="gap-4 gap-y-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4
    [@media(min-width:1920px)]:grid-cols-5 [@media(min-width:2200px):grid-cols-6 ">
      {Array.from({length:18}).map((_,index)=>(
        <PlaylistGridCardSkeleton key={index}/>
      ))}
    </div>
  )
}

const PlaylistsSectionSuspense=()=>{
  const [playlists,query] =trpc.playlists.getMany.useSuspenseInfiniteQuery(
    {limit:DEFAULT_LIMIT},
  {
    getNextPageParam:(lastPage)=>lastPage.nextCursor,
  }
  );
```

# Chapter 30 Populating playlists

## Requirements

Add a button in every video menu: add to playlist 
and it will alert a addtoplaylist modal, it will display all playlists you created by yourself,and if this video already added to one playlist,the button will be checked, and if you click it ,it will be removed from the playlist, and if this video didn't add to this playlist,you click it, it will be added to this playlist

## Workflow

![image-20250810212924605](/Users/a1/Library/Application Support/typora-user-images/image-20250810212924605.png)

## Create PlaylistAddModal component

### src/modules/playlists/ui/components/playlist-add-modal.tsx

```tsx
import { InfiniteScroll } from "@/components/infinite-scroll";
import { ResponsiveModal } from "@/components/responsive-dialog";
import { Button } from "@/components/ui/button";
import { DEFAULT_LIMIT } from "@/constants";
import { trpc } from "@/trpc/client";
import { Loader2Icon, SquareCheckIcon, SquareIcon } from "lucide-react";



 interface PlaylistAddModalProps{
  open:boolean; // 控制模态框显示/隐藏
  onOpenChange:(open:boolean)=>void;// 状态变更回调
  videoId:string;
 };
 export const PlaylistAddModal=({
  open,
  onOpenChange,
  videoId,
 }:PlaylistAddModalProps)=>{
  const utils=trpc.useUtils();
  const {
    data:playlists,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  }=trpc.playlists.getManyForVideo.useInfiniteQuery({
    limit:DEFAULT_LIMIT,
    videoId,
  },{
    getNextPageParam:(lastPage)=>lastPage.nextCursor,
    enabled: !!videoId && open,
  })

  return (
    <ResponsiveModal
      title="Add to playlist"
      open={open}
      onOpenChange={onOpenChange}
    >
    <div className="flex flex-col gap-2">
      {isLoading &&(
        <div className="flex justify-center p-4">
          <Loader2Icon className="size-5 animate-spin text-muted-foreground"/>
        </div>
      )}
      {!isLoading &&
        playlists?.pages
            .flatMap((page)=>page.items)
            .map((playlist)=>(
              <Button 
              key={playlist.id}
              variant="ghost"
              className="w-full justify-start px-2 [&_svg]:size-5"
              size="lg"
              >
                {playlist.containsVideo ? (
                  <SquareCheckIcon className="mr-2"/>
                ):<SquareIcon className="mr-2"/>}
                {playlist.name}
              </Button>
            ))
      }
      {!isLoading && (
       <InfiniteScroll
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        fetchNextPage={fetchNextPage}
        isManual
     />
      )}
    </div>
    </ResponsiveModal>
  );
};
```

### src/modules/videos/ui/components/video_menu.tsx

```tsx
const [isOpenPlaylistAddModal,setIsOpenPlaylistAddModal]=useState(false);
<PlaylistAddModal
  	videoId={videoId}
    open={isOpenPlaylistAddModal}
    onOpenChange={setIsOpenPlaylistAddModal}
    />
    
<DropdownMenuItem onClick={()=>setIsOpenPlaylistAddModal(true)}>
          <ListPlusIcon className="mr-2 size-4"/>
          Add to playlist
        </DropdownMenuItem>
```

## Create getManyForVideo playlist procedure

### src/modules/playlists/server/procedures.ts

```ts
 getManyForVideo:protectedProcedure
    .input(
      z.object({   
        videoId:z.string().uuid(),
        cursor:z.object({
          id:z.string().uuid(),
          updatedAt:z.date(),
        })
        .nullish(),
        limit:z.number().min(1).max(100),
      })
    )
    .query(async({ctx,input})=>{
      const {id:userId}=ctx.user;
      const {cursor,limit,videoId}=input;

      const data=await db
        .select({
          ...getTableColumns(playlists),
          videoCount:db.$count(
            playlistVideos,
            eq(playlists.id,playlistVideos.playlistId)
          ),
          user:users,
          /* pv 是 playlist_videos 的别名  */
          containsVideo:videoId
            ? sql<boolean>`(
              SELECT EXISTS(
                SELECT 1
                FROM ${playlistVideos} pv 
                WHERE pv.playlist_id=${playlists.id} AND pv.video_id=${videoId}
              )
            )`
            : sql<boolean>`false`
        })
        .from(playlists)
        .innerJoin(users,eq(playlists.userId,users.id))
        .where(and(
          eq(playlists.userId,userId),
          cursor
            ? or(
              lt(playlists.updatedAt,cursor.updatedAt),
              and(
                eq(playlists.updatedAt,cursor.updatedAt),
                lt(videos.id,cursor.id)
              ))
            :undefined,
          )).orderBy(desc(playlists.updatedAt),desc(playlists.id))
          // Add 1 to the limit to check if there is more data
          .limit(limit+1)
          const hasMore=data.length >limit
          //remove the last item if there is more data
          const items=hasMore ?data.slice(0,-1):data
          //set the next cursor to the last item if there is more data
          const lastItem=items[items.length-1];
          const nextCursor=hasMore ?
            {
              id:lastItem.id,
              updatedAt:lastItem.updatedAt,
            }:null;
        return {
          items,
          nextCursor
        };
    }),
```

## Create add and remove procedures for playlists

### src/modules/playlists/server/procedures.ts

```ts
removeVideo:protectedProcedure
      .input(z.object({
        playlistId:z.string().uuid(),
        videoId:z.string().uuid(),
      }))
      .mutation(async({input,ctx})=>{
        const {playlistId,videoId}=input;
        const {id:userId}=ctx.user;

        const [existingPlaylist]=await db
            .select()
            .from(playlists)
            .where(eq(playlists.id,playlistId));
        
        if(!existingPlaylist){
          throw new TRPCError({code:"NOT_FOUND"})
        }    
        if(existingPlaylist.userId !==userId){
          throw new TRPCError({code:"FORBIDDEN"});
        }
        const [existingVideo]=await db
            .select()
            .from(videos)
            .where(eq(videos.id,videoId));
        if(!existingVideo){
              throw new TRPCError({code:"NOT_FOUND"})
            }   
        const [existingPlaylistVideo]=await db
              .select()
              .from(playlistVideos)
              .where(
                and(
                  eq(playlistVideos.playlistId,playlistId),
                  eq(playlistVideos.videoId,videoId),
                )
              );    
        if(!existingPlaylistVideo){
          throw new TRPCError({code:"NOT_FOUND"})
        }   
        const [deletedPlaylistVideo]= await db
              .delete(playlistVideos)
              .where(
                and(
                  eq(playlistVideos.playlistId,playlistId),
                  eq(playlistVideos.videoId,videoId),
                )
              )
              .returning();
        return deletedPlaylistVideo;      
      }),
    addVideo:protectedProcedure
      .input(z.object({
        playlistId:z.string().uuid(),
        videoId:z.string().uuid(),
      }))
      .mutation(async({input,ctx})=>{
        const {playlistId,videoId}=input;
        const {id:userId}=ctx.user;

        const [existingPlaylist]=await db
            .select()
            .from(playlists)
            .where(eq(playlists.id,playlistId));
        
        if(!existingPlaylist){
          throw new TRPCError({code:"NOT_FOUND"})
        }    
        if(existingPlaylist.userId !==userId){
          throw new TRPCError({code:"FORBIDDEN"});
        }
        const [existingVideo]=await db
            .select()
            .from(videos)
            .where(eq(videos.id,videoId));
        if(!existingVideo){
              throw new TRPCError({code:"NOT_FOUND"})
            }   
        const [existingPlaylistVideo]=await db
              .select()
              .from(playlistVideos)
              .where(
                and(
                  eq(playlistVideos.playlistId,playlistId),
                  eq(playlistVideos.videoId,videoId),
                )
              );    
        if(existingPlaylistVideo){
          throw new TRPCError({code:"NOT_FOUND"})
        }   
        const [createdPlaylistVideo]= await db
              .insert(playlistVideos)
              .values({playlistId,videoId})
              .returning();
        return createdPlaylistVideo;      

      }),
```

### src/modules/playlists/ui/components/playlist-add-modal.tsx

```tsx
 const addVideo=trpc.playlists.addVideo.useMutation({
    onSuccess:()=>{
      toast.success("Video added to playlist");
      utils.playlists.getMany.invalidate();
      //refetch trpc.playlists.getManyForVideo.useInfiniteQuery({ and give us new information whether this playlist contains a video or not
      utils.playlists.getManyForVideo.invalidate({videoId});
      //TODO:invalidate playlists.getOne
    },
    onError:()=>{
      toast.error("Something went wrong")
    }
  })

  const removeVideo=trpc.playlists.removeVideo.useMutation({
    onSuccess:()=>{
      toast.success("Video removed from playlist");
      utils.playlists.getMany.invalidate();
      //refetch trpc.playlists.getManyForVideo.useInfiniteQuery({ and give us new information whether this playlist contains a video or not
      utils.playlists.getManyForVideo.invalidate({videoId});
      //TODO:invalidate playlists.getOne
    },
    onError:()=>{
      toast.error("Something went wrong")
    }
  })
  
  
  
  <Button 
              key={playlist.id}
              variant="ghost"
              className="w-full justify-start px-2 [&_svg]:size-5"
              size="lg"
              onClick={()=>{
                if(playlist.containsVideo){
                  removeVideo.mutate({playlistId:playlist.id,videoId})
                }else{
                  addVideo.mutate({playlistId:playlist.id,videoId})
                }
              }}
              disabled={removeVideo.isPending || addVideo.isPending }
              >
```

## go to create a query where which will allow us to load the current thumbnail in playlist page

### src/modules/playlists/server/prcedures.ts

```ts
 getMany:protectedProcedure
    .input(
      z.object({   
        cursor:z.object({
          id:z.string().uuid(),
          updatedAt:z.date(),
        })
        .nullish(),
        limit:z.number().min(1).max(100),
      })
    )
    .query(async({ctx,input})=>{
      const {id:userId}=ctx.user;
      const {cursor,limit}=input;

      const data=await db
        .select({
          ...getTableColumns(playlists),
          videoCount:db.$count(
            playlistVideos,
            eq(playlists.id,playlistVideos.playlistId)
          ),
          user:users,
          thumbnailUrl: sql<string | null>`(
            SELECT v.thumbnail_url
            FROM ${playlistVideos} pv
            join ${videos} v ON v.id =pv.video_id
            WHERE pv.playlist_id=${playlists.id}
            ORDER BY pv.updated_at DESC
            LIMIT 1
          )`
        })
```

### src/modules/playlists/ui/components/playlist-grid-card/index.ts

```ts
return(
    <Link href={`/playlists/${data.id}`}>
      <div className="flex flex-col gap-2 w-full group">
        <PlaylistThumbnail
          imageUrl={data.thumbnailUrl ||THUMBNAIL_FALLBACK}
```

# Chapter 31 Individual playlist

## Requirements

when click the individual playlist ,it will trun to the single playlist,it will display the playlist name,and we can delete this playlist ,and see all videos that added to this playlist,and we can remove one specific video from that playlist

## Workflow

![image-20250810222943245](/Users/a1/Library/Application Support/typora-user-images/image-20250810222943245.png)

## create "getVideos" procedure to load custom playlist's videos

### src/modules/playlists/server/procedures.ts

```ts
getVideos:protectedProcedure
    .input(
      z.object({   
        playlistId:z.string().uuid(),
        cursor:z.object({
          id:z.string().uuid(),
          updatedAt:z.date(),
        })
        .nullish(),
        limit:z.number().min(1).max(100),
      })
    )
    .query(async({ctx,input})=>{
      const {id:userId}=ctx.user;
      const {cursor,limit,playlistId}=input;
      //viewing all playlists private to the user that created 
      const [existingPlaylist]=await db
              .select()
              .from(playlists)
              .where(and(
                eq(playlists.id,playlistId),
                eq(playlists.userId,userId),
              ))
          if(!existingPlaylist){
            throw new TRPCError({code:"NOT_FOUND"})
          }
      const videosFromPlaylist=db.$with("playlist_videos").as(
        db
          .select({
            videoId:playlistVideos.videoId,
          })
          .from(playlistVideos)
          .where(eq(playlistVideos.playlistId,playlistId))
      )

      const data=await db
        .with(videosFromPlaylist)  
        .select({
          ...getTableColumns(videos),
          user:users,
          viewCount:db.$count(videoViews,eq(videoViews.videoId,videos.id)),
          likeCount:db.$count(videoReactions,and(
            eq(videoReactions.videoId,videos.id),
            eq(videoReactions.type,"like"),
            )),
          dislikeCount:db.$count(videoReactions,and(
            eq(videoReactions.videoId,videos.id),
            eq(videoReactions.type,"dislike"),
            )), 
        })
        .from(videos)
        .innerJoin(users,eq(videos.userId,users.id))
        .innerJoin(videosFromPlaylist,eq(videos.id,videosFromPlaylist.videoId))
        .where(and(
          eq(videos.visibility,"public"),
          cursor
            ? or(
              lt(videos.updatedAt,cursor.updatedAt),
              and(
                eq(videos.updatedAt,cursor.updatedAt),
                lt(videos.id,cursor.id)
              ))
            :undefined,
          )).orderBy(desc(videos.updatedAt),desc(videos.id))
          // Add 1 to the limit to check if there is more data
          .limit(limit+1)
          const hasMore=data.length >limit
          //remove the last item if there is more data
          const items=hasMore ?data.slice(0,-1):data
          //set the next cursor to the last item if there is more data
          const lastItem=items[items.length-1];
          const nextCursor=hasMore ?
            {
              id:lastItem.id,
              updatedAt:lastItem.updatedAt
            }:null;
        return {
          items,
          nextCursor
        };
    }),
```

## build custom playlist page

### create src/app/(home)/playlists/[playlistId]/page.tsx

```tsx
import { DEFAULT_LIMIT } from '@/constants'
import { VideosView } from '@/modules/playlists/ui/views/videos-view';
import { HydrateClient, trpc } from '@/trpc/server'
import React from 'react'
export const dynamic="force-dynamic";

interface PageProps{
  params:Promise<{playlistId:string}>;
}

const Page = async ({params}:PageProps) => {
  const {playlistId}=await params;
  void trpc.playlists.getVideos.prefetchInfinite({playlistId,limit:DEFAULT_LIMIT})
  return (
    <HydrateClient>
      <VideosView playlistId={playlistId}/>
    </HydrateClient>
  )
}

export default Page
```

### create src/modules/playlists/ui/views/videos-view.tsx

```tsx
import React from 'react'
import { PlaylistHeaderSection } from '../sections/playlist-header-section';
import { VideosSection } from '../sections/videos-section';

interface VideosViewProps{
  playlistId:string;
}


export const VideosView = ({playlistId}:VideosViewProps) => {
  return (
   <div className="max-w-screen-md mx-auto mb-10 px-4 pt-2.5 flex flex-col gap-y-6">
      <PlaylistHeaderSection playlistId={playlistId}/>
      <VideosSection playlistId={playlistId}/>
    </div>  
  )
}
```

### create src/modules/playlists/ui/sections/videos-section.tsx

```tsx
"use client"
import { InfiniteScroll } from "@/components/infinite-scroll";
import { DEFAULT_LIMIT } from "@/constants";
import { VideoGridCard, VideoGridCardSkeleton } from "@/modules/videos /ui/components/video-grid-card";
import { VideoRowCard, VideoRowCardSkeleton } from "@/modules/videos /ui/components/video-row-card";
import { trpc } from "@/trpc/client";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

interface VideosSectionProps{
  playlistId:string;
}

export const VideosSection=(props:VideosSectionProps)=>{
  return(
    <Suspense fallback={<VideosSectionSkeleton/>}>
    <ErrorBoundary fallback={<p>Error</p>}>
      <VideosSectionSuspense {...props}/>
    </ErrorBoundary>
  </Suspense>
  )
}

const VideosSectionSkeleton=()=>{
  return (
    <div>
      <div className="gap-2 gap-y-2 flex flex-col md:hidden" >
        {Array.from({length:18}).map((_,index)=>(
            <VideoGridCardSkeleton key={index} />
          ))
          }
      </div>
      <div className="gap-2 gap-y-2 hidden flex-col md:flex " >
        {Array.from({length:18}).map((_,index)=>(
            <VideoRowCardSkeleton key={index} size="compact"/>
          ))
          }
      </div>
    </div>
    
  )
}

const VideosSectionSuspense=({playlistId}:VideosSectionProps)=>{
  const [videos,query] =trpc.playlists.getVideos.useSuspenseInfiniteQuery(
    {limit:DEFAULT_LIMIT,playlistId},
  {
    getNextPageParam:(lastPage)=>lastPage.nextCursor,
  }
  );

  return(
    <div>
      <div className="gap-2 gap-y-2 flex flex-col md:hidden " >
        {videos.pages
          .flatMap((page)=>page.items)
          .map((video)=>(
            <VideoGridCard key={video.id} data={video}/>
          ))
          }
      </div>
      <div className="gap-2 gap-y-2 hidden flex-col md:flex " >
        {videos.pages
          .flatMap((page)=>page.items)
          .map((video)=>(
            <VideoRowCard key={video.id} data={video} size="compact"/>
          ))
          }
      </div>
      <InfiniteScroll
      hasNextPage={query.hasNextPage}
      isFetchingNextPage={query.isFetchingNextPage}
      fetchNextPage={query.fetchNextPage}
      />
    </div>
  )
  
}
```

### src/modules/playlists/server/procedures.ts

```ts
getOne:protectedProcedure
        .input(z.object({id:z.string().uuid()}))
        .query(async ({input,ctx})=>{
          const{id}=input;
          const {id:userId}=ctx.user;
          const [existingPlaylist]=await db
                  .select()
                  .from(playlists)
                  .where(and(
                    eq(playlists.id,id),
                    eq(playlists.userId,userId),
                  ))
              if(!existingPlaylist) {
                throw new TRPCError({code:"NOT_FOUND"});
              }
              return existingPlaylist;       
        }),
```

### src/app/(home)/playlists/[playlistId]/page.tsx

```tsx
void trpc.playlists.getOne.prefetch({id:playlistId})
```

### src/modules/playlists/ui/sections/playlist-header-section.tsx

```tsx
"use client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/trpc/client";
import { Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { toast } from "sonner";

interface PlaylistHeaderSectionProps{
  playlistId:string;
}

//get the playlist name


export const PlaylistHeaderSection=({
  playlistId}:PlaylistHeaderSectionProps)=>{
    return (
      <Suspense fallback={<PlaylistHeaderSectionSkeleton/>}>
        <ErrorBoundary fallback={<p>Error</p>}>
          <PlaylistHeaderSectionSuspense playlistId={playlistId}/>
        </ErrorBoundary>
      </Suspense>
    )
}

const PlaylistHeaderSectionSkeleton=()=>{
  return(
    <div className="flex flex-col gap-y-2">
    <Skeleton className="h-6 w-24"/>
    <Skeleton className="h-4 w-32"/>
  </div>
  )
}

const PlaylistHeaderSectionSuspense=({
  playlistId,
}:PlaylistHeaderSectionProps)=>{
  const [playlist]=trpc.playlists.getOne.useSuspenseQuery({id:playlistId});
  const utils=trpc.useUtils();
  const router=useRouter();
  const remove =trpc.playlists.remove.useMutation({
    onSuccess:()=>{
      toast.success("Playlist removed");
      utils.playlists.getMany.invalidate();
      router.push("/playlists");
    },
    onError:()=>{
      toast.error("Something went wrong")
    }
  })
  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold">{playlist.name}</h1>
        <p className="text-xs text-muted-foreground">
          Videos from the playlist
        </p>
      </div>
      <Button
        variant="outline"
        size="icon"
        className="rounded-full"
        onClick={()=>remove.mutate({id:playlistId})}
        disabled={remove.isPending}
      >
        <Trash2Icon/>
      </Button>
    </div>
  )
}
```

## add ability to delete a playlist

### src/modules/playlists/server/procedures.ts

```ts
remove:protectedProcedure
        .input(z.object({id:z.string().uuid()}))
        .mutation(async ({input,ctx})=>{
          const{id}=input;
          const {id:userId}=ctx.user;
              const [deletedPlaylist]=await db
                  .delete(playlists)
                  .where(and(
                    eq(playlists.id,id),
                    eq(playlists.userId,userId),
                  ))
                  .returning()
                  if(!deletedPlaylist) {
                    throw new TRPCError({code:"NOT_FOUND"});
                  }
                return deletedPlaylist;  
        }),
```

## add ability to remove a video from a playlist

### src/modules/playlists/ui/compnents/playlist-add-modal.tsx

```tsx
const addVideo=trpc.playlists.addVideo.useMutation({
    onSuccess:(data)=>{
      toast.success("Video added to playlist");
      utils.playlists.getMany.invalidate();
      //refetch trpc.playlists.getManyForVideo.useInfiniteQuery({ and give us new information whether this playlist contains a video or not
      utils.playlists.getManyForVideo.invalidate({videoId});
      //TODO:invalidate playlists.getOne
      utils.playlists.getOne.invalidate({id:data.playlistId});
      utils.playlists.getVideos.invalidate({playlistId:data.playlistId});
    },
    onError:()=>{
      toast.error("Something went wrong")
    }
  })

  const removeVideo=trpc.playlists.removeVideo.useMutation({
    onSuccess:(data)=>{
      toast.success("Video removed from playlist");
      utils.playlists.getMany.invalidate();
      //refetch trpc.playlists.getManyForVideo.useInfiniteQuery({ and give us new information whether this playlist contains a video or not
      utils.playlists.getManyForVideo.invalidate({videoId});
      //TODO:invalidate playlists.getOne
      utils.playlists.getOne.invalidate({id:data.playlistId});
      utils.playlists.getVideos.invalidate({playlistId:data.playlistId});
    },
    onError:()=>{
      toast.error("Something went wrong")
    }
  })
```

### src/modules/playlists/ui/sections/video-section.tsx

```tsx
const utils=trpc.useUtils();
  const removeVideo=trpc.playlists.removeVideo.useMutation({
    onSuccess:(data)=>{
      toast.success("Video removed from playlist");
      utils.playlists.getMany.invalidate();
      //refetch trpc.playlists.getManyForVideo.useInfiniteQuery({ and give us new information whether this playlist contains a video or not
      utils.playlists.getManyForVideo.invalidate({videoId:data.videoId});
      //TODO:invalidate playlists.getOne
      utils.playlists.getOne.invalidate({id:data.playlistId});
      utils.playlists.getVideos.invalidate({playlistId:data.playlistId});
    },
    onError:()=>{
      toast.error("Something went wrong")
    }
  })
  
  <VideoGridCard 
            key={video.id} 
            data={video} 
            onRemove={()=>removeVideo.mutate({playlistId,videoId:video.id})}/>


<VideoRowCard 
            key={video.id} 
            data={video} 
            size="compact"
            onRemove={()=>removeVideo.mutate({playlistId,videoId:video.id})}/>
```

![image-20250609154450234](/Users/a1/Library/Application Support/typora-user-images/image-20250609154450234.png)

rewrite it to real info

### src/modues/studio/ui/sections/video-section.tsx

```tsx
{/* 是一个 用于文本溢出处理的工具类，可以让文本超出容器宽度时显示为省略号（...）*/}
                  <TableCell className="text-sm truncate">
                    {format(new Date(video.createdAt),"d MMM yyyy")}
                  </TableCell>
                  <TableCell>
                    {video.viewCount}
                  </TableCell>
                  <TableCell>
                    {video.commentCount}
                  </TableCell>
                  <TableCell>
                    {video.likeCount}
                  </TableCell>
```

### src/modules/studio/server/procedures.ts

```ts
const data=await db
      .select({
        ...getTableColumns(videos),
        viewCount:db.$count(videoViews,eq(videoViews.videoId,videos.id)),
        commentCount:db.$count(comments,eq(comments.videoId,videos.id)),
        likeCount:db.$count(
          videoReactions,
          and(
            eq(videoReactions.type,"like"),
            eq(videoReactions.videoId,videos.id),
          )
        ),
        user:users,
      })
      .from(videos)
      .innerJoin(users,eq(videos.userId,users.id))
```

# Chapter 31User Page

![image-20250811205605686](/Users/a1/Library/Application Support/typora-user-images/image-20250811205605686.png)

## Requirements

when click user avatar,it will direct us to the user's profile

if the user is itself,then we can edit the banner and go to the studio 

if not,we can only do subscribe or unsubscribe operation

in our proflie page ,we can see all the subscribers and all videos counts of this user, and can browse his/her videos

## Workflow

![image-20250811211414512](/Users/a1/Library/Application Support/typora-user-images/image-20250811211414512.png)

![image-20250811211439957](/Users/a1/Library/Application Support/typora-user-images/image-20250811211439957.png)

![image-20250811212025731](/Users/a1/Library/Application Support/typora-user-images/image-20250811212025731.png)

## Add "bannerUrl" and "bannerKey" to user schema

### src/db/schema.ts

```ts
export const users=pgTable("users",{
  id: uuid("id").primaryKey().defaultRandom(),
  clerkId: text("clerk_id").unique().notNull(),
  name: text("name").notNull(),
  //TODO :add banner fields
  bannerUrl:text("banner_url"),
  bannerKey:text("banner_key"),
  imageUrl:text('image_url').notNull(),
  createdAt:timestamp("created_at").defaultNow().notNull(),
  updatedAt:timestamp("updated_at").defaultNow().notNull(),
},(t)=>[uniqueIndex("clerk_id_idx").on(t.clerkId)]);
```

## Create "users.getOne" procedure

### src/modules/users/server/procedures.ts

```ts
import { db} from "@/db";
import { subscriptions, users, videos } from "@/db/schema";
import {z} from 'zod';
import { baseProcedure, createTRPCRouter} from "@/trpc/init";
import { eq,getTableColumns, inArray, isNotNull } from "drizzle-orm";
import { TRPCError } from "@trpc/server";


  export const usersRouter=createTRPCRouter({ 
    getOne:baseProcedure
        .input(z.object({id:z.string().uuid()}))
        .query(async ({input,ctx})=>{
          //从请求上下文（ctx）中取出来的，是当前登录用户的 ID。通过它查数据库得到当前登录用户的 userId，用于查询他对视频的行为（点赞、点踩等）
          const {clerkUserId}=ctx;
          let userId;
          const [user]=await db
                .select()
                .from(users) 
                //这里使用 inArray，是因为 这个查询条件要么是一个包含一个元素的数组，要么是空数组，而 inArray 支持传入任意长度的数组。
                .where(inArray(users.clerkId,clerkUserId ? [clerkUserId]:[])) 
          //If user is found, store the user ID.      
          if(user){
            userId=user.id;
          } 

           const viewerSubscriptions=db.$with("viewer_subscriptions").as(
            db
              .select()
              .from(subscriptions)
              .where(inArray(subscriptions.viewerId,userId ? [userId]:[]))
           )

          const [existingUser]=await db
           /* if you want to do an Join-something on that table,you have to add with in the beginning here */
            .with(viewerSubscriptions)  
            .select({
              ...getTableColumns(users),
              viewerSubscribed:isNotNull(viewerSubscriptions.viewerId).mapWith(Boolean),
              videoCount:db.$count(videos,eq(videos.userId,users.id)),
              subscriberCount:db.$count(subscriptions,eq(subscriptions.creatorId,users.id)),
            })
            .from(users)
            .leftJoin(viewerSubscriptions,eq(viewerSubscriptions.creatorId,users.id))
            .where(eq(users.id,input.id))
            if(!existingUser){
              throw new TRPCError({code:"NOT_FOUND"})
            }
            return existingUser;
        }),
});
```

## Create userId page

### Create banner part

#### src/app/(home)/users/[userId]/page.tsx

```tsx
import { UserView } from '@/modules/users/views/user-view';
import { HydrateClient, trpc } from '@/trpc/server';
import React from 'react'

interface PageProps{
  params:Promise<{
    userId:string;
  }>
}


const Page = async ({params}:PageProps) => {
  const {userId}=await params;
  void trpc.users.getOne.prefetch({id:userId})
  return (
    <HydrateClient>
      <UserView userId={userId}/>
    </HydrateClient>
   
  )
}

export default Page;
```

#### src/modules/users/views/user-view.tsx

```tsx
import { UserSection } from "../sections/user-section";

interface UserViewProps{
  userId:string;
}

export const UserView=({userId}:UserViewProps)=>{
  return (
    <div className="flex flex-col max-w-[1300px] px-4 pt-2.5 mx-auto mb-10 gap-y-6">
      <UserSection userId={userId}/>
    </div>
  )
}
```

#### src/modules/users/sections/user-section.tsx

```tsx
"use client";
import { trpc } from "@/trpc/client";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { UserPageBanner } from "../ui/components/uer-page-banner";

interface UserSectionProps{
  userId:string;
};

export const UserSection=(props:UserSectionProps)=>{
 return (
  <Suspense fallback={<p>Loading...</p>}>
    <ErrorBoundary fallback={<p>Error</p>}>
      <UserSectionSuspense {...props}/>
    </ErrorBoundary>
  </Suspense>
 )
}

const UserSectionSuspense=({userId}:UserSectionProps)=>{
  const [user]=trpc.users.getOne.useSuspenseQuery({id:userId})
  return (
    <div className="flex flex-col">
       <UserPageBanner user={user}/> 
    </div>
  )
}
```

#### src/modules/users/ui/components/user-page-banner.tsx

```tsx
import { cn } from "@/lib/utils";
import { UserGetOneOutput } from "../../types";
import { Button } from "@/components/ui/button";
import { useAuth } from "@clerk/nextjs";
import { Edit2Icon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface UserPageBannerProps{
  user:UserGetOneOutput;
}

export const UserPageBannerSkeleton=()=>{
  return <Skeleton className="w-full max-h-[200px] h-[15vh] md:h-[25vh]"/>
}

export const UserPageBanner=({user}:UserPageBannerProps)=>{
  const {userId}=useAuth();
  return (
    <div className="relative group">
      {/* TODO:Add upload banner modal */}
      <div className={cn(
        "w-full max-h-[200px] h-[15vh] md:h-[25vh] bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl",
        user.bannerUrl? "bg-cover bg-center" : "bg-gray-100"
      )}
        style={{
          // In React, when you set a style key (like backgroundImage) within the style prop to undefined, React will completely omit that style property when rendering.
          backgroundImage:user.bannerUrl
              ?`url(${user.bannerUrl})`
              :undefined
        }}
      
      >
        {user.clerkId===userId &&(
          <Button
            type="button"
            size="icon"
            className="absolute top-4 right-4 rounded-full  bg-black/50 hover:bg-black/50  opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          >
            <Edit2Icon className="size-4 text-white"/>
          </Button>
        )}
      </div>
    </div>
  )
}
```

#### src/modules/users/type.ts

```ts
import {inferRouterOutputs} from "@trpc/server";
import {AppRouter} from "@/trpc/routers/_app";

export type UserGetOneOutput=
//You're inferring(获取) the return type of the videos.getOne API route and naming it VideoGetOneOutput.
       inferRouterOutputs<AppRouter>["users"]["getOne
```

### create user Info part

#### src/modules/users/sections/user-section.tsx

```tsx
"use client";
import { trpc } from "@/trpc/client";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { UserPageBanner } from "../ui/components/uer-page-banner";
import { UserPageInfo } from "../ui/components/uaer-page-info";

interface UserSectionProps{
  userId:string;
};

export const UserSection=(props:UserSectionProps)=>{
 return (
  <Suspense fallback={<p>Loading...</p>}>
    <ErrorBoundary fallback={<p>Error</p>}>
      <UserSectionSuspense {...props}/>
    </ErrorBoundary>
  </Suspense>
 )
}

const UserSectionSuspense=({userId}:UserSectionProps)=>{
  const [user]=trpc.users.getOne.useSuspenseQuery({id:userId})
  return (
    <div className="flex flex-col">
       <UserPageBanner user={user}/> 
       <UserPageInfo user={user}/>
    </div>
  )
}
```

#### src/modules/users/ui/components/user-page-info.tsx

```tsx
import { UNSTABLE_REVALIDATE_RENAME_ERROR } from "next/dist/lib/constants";
import { UserGetOneOutput } from "../../types";
import { UserAvatar } from "@/components/user-avatar";
import { useAuth, useClerk } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { SubscriptionButton } from "@/modules/subscriptions/ui/components/subscription-button";
import { UseSubscription } from "@/modules/subscriptions/hooks/use-subscription";
import { cn } from "@/lib/utils";

interface UserPageInfoProps {
  user:UserGetOneOutput;
}

export const UserPageInfo=({user}:UserPageInfoProps)=>{
  const {userId,isLoaded}=useAuth();
  const clerk=useClerk();
  const {isPending,onClick}=UseSubscription({
    userId:user.id,
    isSubscribed:user.viewerSubscribed,
  })
  return(
    <div className="py-6">
      {/* Mobile layout */}
      <div className="flex flex-col md:hidden">
        <div className="flex items-center gap-3">
          <UserAvatar 
            size="lg"
            imageUrl={user.imageUrl}
            name={user.name}
            className="h-[60px] w-[60px]"
            onClick={()=>{
              if(user.clerkId===userId){
                clerk.openUserProfile();
              }
            }}
          />
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold">{user.name}</h1>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <span>{user.subscriberCount} subscribers</span>
              <span>•</span>
              <span>{user.videoCount} videos</span>
            </div>
          </div>
        </div>
        {userId===user.clerkId ? (
          <Button
            variant="secondary"
            asChild
            className="w-full mt-3 rounded-full"
          >
            <Link href="/studio">Go to studio</Link>
          </Button>
        ):(
          <SubscriptionButton
            disabled={isPending || !isLoaded}
            isSubscribed={user.viewerSubscribed}
            onClick={onClick}
            className="w-full mt-3"
          />
        )}
      </div>
      <div className="hidden md:flex  items-start gap-4">
          <UserAvatar
            size="xl"
            imageUrl={user.imageUrl}
            name={user.name}
            className={cn(userId===user.clerkId && "cursor-pointer hover:opacity transition-opacity duration-300")}
            onClick={()=>{
              if(user.clerkId===userId){
                clerk.openUserProfile();
              }
            }}
          />  
          <div className="flex-1 min-w-0">
            <h1 className="text-4xl font-bold">{user.name}</h1>
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-3">
              <span>{user.subscriberCount} subscribers</span>
              <span>•</span>
              <span>{user.videoCount} videos</span>
            </div>
            {userId===user.clerkId ? (
          <Button
            variant="secondary"
            asChild
            className=" mt-3 rounded-full"
          >
            <Link href="/studio">Go to studio</Link>
          </Button>
        ):(
          <SubscriptionButton
            disabled={isPending || !isLoaded}
            isSubscribed={user.viewerSubscribed}
            onClick={onClick}
            className="w-full mt-3"
          />
        )}
          </div>
      </div>
    </div>
  )
}
```

#### src/modules/subscriptions/hooks/use-subscription.ts

```ts
const subscribe=trpc.subscriptions.create.useMutation({
    onSuccess:()=>{
      toast.success("Subscribed");
      //TODO:reinvalidate subscriptions.getMany ,users.getOne
      utils.videos.getManySubscribed.invalidate();
      utils.users.getOne.invalidate({id:userId});
      
const unsubscribe=trpc.subscriptions.remove.useMutation({
    onSuccess:()=>{
      toast.success("unsubscribed");
      //TODO:reinvalidate subscriptions.getMany ,users.getOne
      utils.videos.getManySubscribed.invalidate();
      utils.users.getOne.invalidate({id:userId});      
```

![image-20250610175144431](/Users/a1/Library/Application Support/typora-user-images/image-20250610175144431.png)

## Modify "videos.getMany" procedure to accept userId props

### Video part

#### src/modules/videos/server/procedures.ts

```ts
getMany:baseProcedure
    .input(
      z.object({   
        categoryId:z.string().uuid().nullish(),
        userId:z.string().uuid().nullish(),

.query(async({input})=>{
      const {cursor,limit,categoryId,userId}=input;
        
.where(and(
          eq(videos.visibility,"public"),
          categoryId ? eq(videos.categoryId,categoryId):undefined,
          userId ? eq(videos.userId,userId):undefined,        
```

#### src/app/(home)/users/[userId]/page.tsx

```tsx
void trpc.videos.getMany.prefetchInfinite({userId,limit:DEFAULT_LIMIT});
```

#### src/modules/users/views/user-view.tsx

```tsx
import { UserSection } from "../sections/user-section";
import { VideoSection } from "../sections/video-section";

interface UserViewProps{
  userId:string;
}

export const UserView=({userId}:UserViewProps)=>{
  return (
    <div className="flex flex-col max-w-[1300px] px-4 pt-2.5 mx-auto mb-10 gap-y-6">
      <UserSection userId={userId}/>
      <VideoSection userId={userId}/>
    </div>
  )
}
```

#### src/modules/users/sections/video-section.tsx

```tsx
"use client"
import { InfiniteScroll } from "@/components/infinite-scroll";
import { DEFAULT_LIMIT } from "@/constants";
import { VideoGridCard, VideoGridCardSkeleton } from "@/modules/videos /ui/components/video-grid-card";
import { trpc } from "@/trpc/client";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

interface VideosSectionProps{
  userId:string;
}
export const VideoSection=(props:VideosSectionProps)=>{
  return(
    <Suspense key={props.userId} fallback={<VideoSectionSkeleton/>}>
    <ErrorBoundary fallback={<p>Error</p>}>
      <VideoSectionSuspense {...props}/>
    </ErrorBoundary>
  </Suspense>
  )
}

const VideoSectionSkeleton=()=>{
  return (
    <div className="gap-4 gap-y-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 [@media(min-width:1920px)]:grid-cols-4 [@media(min-width:2200px)]:grid-cols-4" >
        {Array.from({length:18}).map((_,index)=>(
            <VideoGridCardSkeleton key={index} />
          ))
          }
      </div>
  )
}

const VideoSectionSuspense=({userId}:VideosSectionProps)=>{
  const [videos,query] =trpc.videos.getMany.useSuspenseInfiniteQuery(
    {userId,limit:DEFAULT_LIMIT},
  {
    getNextPageParam:(lastPage)=>lastPage.nextCursor,
  }
  );

  return(
    <div>
      <div className="gap-4 gap-y-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 [@media(min-width:1920px)]:grid-cols-4 [@media(min-width:2200px)]:grid-cols-4" >
        {videos.pages
          .flatMap((page)=>page.items)
          .map((video)=>(
            <VideoGridCard key={video.id} data={video}/>
          ))
          }
      </div>
      <InfiniteScroll
      hasNextPage={query.hasNextPage}
      isFetchingNextPage={query.isFetchingNextPage}
      fetchNextPage={query.fetchNextPage}
      />
    </div>
  )
  
}
```

![image-20250811211038929](/Users/a1/Library/Application Support/typora-user-images/image-20250811211038929.png)

### Add Skeleton

#### src/modules/users/sections/user-section.tsx

```tsx
"use client";
import { trpc } from "@/trpc/client";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { UserPageBanner, UserPageBannerSkeleton } from "../ui/components/uer-page-banner";
import { UserPageInfo,UserPageInfoSkeleton } from "../ui/components/uaer-page-info";
import { Separator } from "@/components/ui/separator";

interface UserSectionProps{
  userId:string;
};

export const UserSection=(props:UserSectionProps)=>{
 return (
  <Suspense fallback={<UserSectionSkeleton/>}>
    <ErrorBoundary fallback={<p>Error</p>}>
      <UserSectionSuspense {...props}/>
    </ErrorBoundary>
  </Suspense>
 )
}

const UserSectionSkeleton=()=>{
  return (
    <div className="flex flex-col ">
      <UserPageBannerSkeleton/>
      <UserPageInfoSkeleton/>
      <Separator/>
    </div>
  )
}

const UserSectionSuspense=({userId}:UserSectionProps)=>{
  const [user]=trpc.users.getOne.useSuspenseQuery({id:userId})
  return (
    <div className="flex flex-col">
       <UserPageBanner user={user}/> 
       <UserPageInfo user={user}/>
       <Separator/>
    </div>
  )
}
```

#### src/modules/users/ui/components/user-page-info.tsx

```tsx
export const UserPageInfoSkeleton=()=>{
  return(
    <div className="py-6">
      {/* Mobile layout */}
      <div className="flex flex-col md:hidden">
        <div className="flex items-center gap-3">
          <Skeleton className="h-[60px] w-[60px] rounded-full"/>
          <div className="flex-1 min-w-0">
            <Skeleton className="h-6 w-32"/>
            <Skeleton className="h-4 w-48 mt-1"/>
          </div>
        </div>
        <Skeleton className="h-10 w-full mt-3 rounded-full"/>
      </div>
      {/* Desktop Layout */}
      <div className="hidden md:flex items-start gap-4">
        <Skeleton className="h-[160px] w-[160px] rounded-full"/>
        <div className="flex-1 min-w-0">
          <Skeleton className="h-8 w-64"/>
          <Skeleton className="h-10 w-32 mt-3 rounded-full"/>
        </div>
      </div>  
    </div>
  )
}
```

### Here is a question

![image-20250811210932991](/Users/a1/Library/Application Support/typora-user-images/image-20250811210932991.png)

when we click the profile image,it will make a mistake:

![image-20250811211000774](/Users/a1/Library/Application Support/typora-user-images/image-20250811211000774.png)

That's because  in 

#### src/modules/studio/ui/components/studio-sidebar/studio-sidebar-header.tsx

```tsx
import { useUser } from '@clerk/nextjs';
const {user}=useUser();
 <Link href="/users/current">
              <UserAvatar/>                         
```

the userId come from clerk

But in

#### src/app/(home)/users/[userId]/page.tsx

```tsx
  const {userId}=await params;
  void trpc.users.getOne.prefetch({id:userId});
```

userId expects the database ID

#### But there is a little trick that we can do 

##### create src/app/(home)/users/current/route.ts

```ts
import { db } from "@/db";
import { users } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
//直接从服务器取得数据.API 路由处理认证跳转等纯服务端逻辑
export const GET=async ()=>{
  const {userId}=await auth();
  if(!userId){
    return redirect("/sign-in")
  }
  const [existingUser]=await db
          .select()
          .from(users)
          .where(eq(users.clerkId,userId));
  if(!existingUser){
    return redirect("/sign-in");
  }    
  return redirect(`/users/${existingUser.id}`)      
}
```

### src/modules/auth/ui/components/auth-button.tsx

```tsx
<UserButton>
        <UserButton.MenuItems>
          <UserButton.Link 
            label="My profile"
            href="/users/current"
            labelIcon={<UserIcon className="size-4"/>}
          />
```

![image-20250610222618695](/Users/a1/Library/Application Support/typora-user-images/image-20250610222618695.png)

# Chapter 32 Banner upload

## Workflow

![image-20250811222651368](/Users/a1/Library/Application Support/typora-user-images/image-20250811222651368.png)

## Implement "bannerUploader" in uploadthing/core.ts

### src/app/api/uploadthing/core.ts

```ts
import { db } from "@/db";
import { users, videos } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError,UTApi } from "uploadthing/server";
import { z } from "zod";

//f 定义文件上传规则的入口。
const f = createUploadthing();
//定义上传路由：thumbnailUploader
export const ourFileRouter = {
  bannerUploader: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    // 权限控制 .middleware(...)
    .middleware(async () => {
      // This code runs on your server before upload
      const {userId:clerkUserId} = await auth();
      if (!clerkUserId) throw new UploadThingError("Unauthorized");
      //we have to check if user ID is the user ID from the database not just the clerk userID
      const[existingUser]=await db
            .select()
            .from(users)
            .where(eq(users.clerkId,clerkUserId));
            if(!existingUser) throw new UploadThingError("Unauthorized");
          if(existingUser.bannerKey){
            const utapi=new UTApi();
            await utapi.deleteFiles(existingUser.bannerKey);
            await db
                  .update(users)
                  .set({bannerKey:null,bannerUrl:null})
                  .where(and(
                    eq(users.id,existingUser.id)
                  ))
          }
      // 如果成功，返回 user + videoId，将传入下一个阶段（上传成功回调）。
      return {userId:existingUser.id};
    })
    //上传成功后 .onUploadComplete(...)
    .onUploadComplete(async ({ metadata, file }) => {
      await db
        .update(users)
        .set({
          //把文件链接 file.url 写入数据库 videos.thumbnailUrl
          bannerUrl:file.url,
          bannerKey:file.key,
        })
        .where(
          eq(users.id,metadata.userId),
          )
      // 最后把 userId 返回客户端（可选）。
      return { uploadedBy: metadata.userId };
    }),
  // Define as many FileRoutes as you like, each with a unique routeSlug
  thumbnailUploader: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
  //输入校验 .input(...)
  .input(z.object({
    videoId:z.string().uuid(),
  }))
    // 权限控制 .middleware(...)
    .middleware(async ({ input }) => {
      // This code runs on your server before upload
      const {userId:clerkUserId} = await auth();
      if (!clerkUserId) throw new UploadThingError("Unauthorized");
      //we have to check if user ID is the user ID from the database not just the clerk userID
      const[user]=await db
            .select()
            .from(users)
            .where(eq(users.clerkId,clerkUserId));
            if(!user) throw new UploadThingError("Unauthorized");
      const[existingVideo]=await db
          .select({
            thumbnailKey:videos.thumbnailKey,
          })
          .from(videos)
          .where(and(
            eq(videos.id,input.videoId),
            eq(videos.userId,user.id),
          ))        
          if(!existingVideo) throw new UploadThingError("NOT FOUND")
          if(existingVideo.thumbnailKey){
            const utapi=new UTApi();
            await utapi.deleteFiles(existingVideo.thumbnailKey);
            await db
                  .update(videos)
                  .set({thumbnailKey:null,thumbnailUrl:null})
                  .where(and(
                    eq(videos.id,input.videoId),
                    eq(videos.userId,user.id),
                  ))
          }
      // 如果成功，返回 user + videoId，将传入下一个阶段（上传成功回调）。
      return { user,...input};
    })
    //上传成功后 .onUploadComplete(...)
    .onUploadComplete(async ({ metadata, file }) => {
      await db
        .update(videos)
        .set({
          //把文件链接 file.url 写入数据库 videos.thumbnailUrl
          thumbnailUrl:file.url,
          thumbnailKey:file.key,
        })
        .where(and(
          eq(videos.id,metadata.videoId),
          eq(videos.userId,metadata.user.id)
          ))
      // 最后把 userId 返回客户端（可选）。
      return { uploadedBy: metadata.user.id };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
```

## Create BannerUploadModal

### create src/modules/users/ui/components/banner-upload-modal.tsx

```tsx
import { ResponsiveModal} from "@/components/responsive-dialog";
import { UploadDropzone } from "@/lib/uploadthing";
import { trpc } from "@/trpc/client";

interface BannerUploadModalProps{
  userId:string;
  open:boolean;
  onOpenChange:(open:boolean)=>void;
};

export const BannerUploadModal=({
  userId,
  open,
  onOpenChange,
}:BannerUploadModalProps)=>{
  const utils=trpc.useUtils();
  const onUploadComplete=()=>{
    onOpenChange(false);
    utils.users.getOne.invalidate({id:userId});
   

  }
  return(
  <ResponsiveModal
  title="Upload a banner"
  open={open}
  onOpenChange={onOpenChange}
  >
   <UploadDropzone
    endpoint="bannerUploader"
    onClientUploadComplete={onUploadComplete}
   />
  </ResponsiveModal>
  )
  }
```

### create src/modules/users/ui/components/user-page-banner.tsx

```tsx
import { cn } from "@/lib/utils";
import { UserGetOneOutput } from "../../types";
import { Button } from "@/components/ui/button";
import { useAuth } from "@clerk/nextjs";
import { Edit2Icon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { BannerUploadModal } from "./banner-upload-modal";
import { useState } from "react";

interface UserPageBannerProps{
  user:UserGetOneOutput;
}

export const UserPageBannerSkeleton=()=>{
  return <Skeleton className="w-full max-h-[200px] h-[15vh] md:h-[25vh]"/>
}

export const UserPageBanner=({user}:UserPageBannerProps)=>{
  const {userId}=useAuth();
  const [isBannerUploadModalOpen,setIsBannerUploadModalOpen]=useState(false);
  return (
    <div className="relative group">
     <BannerUploadModal
      userId={user.id}
      open={isBannerUploadModalOpen}
      onOpenChange={setIsBannerUploadModalOpen}
     />
      <div className={cn(
        "w-full max-h-[200px] h-[15vh] md:h-[25vh] bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl",
        user.bannerUrl? "bg-cover bg-center" : "bg-gray-100"
      )}
        style={{
          // In React, when you set a style key (like backgroundImage) within the style prop to undefined, React will completely omit that style property when rendering.
          backgroundImage:user.bannerUrl
              ?`url(${user.bannerUrl})`
              :undefined
        }}
      
      >
        {user.clerkId===userId &&(
          <Button
            onClick={()=>setIsBannerUploadModalOpen(true)}
            type="button"
            size="icon"
            className="absolute top-4 right-4 rounded-full  bg-black/50 hover:bg-black/50  opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          >
            <Edit2Icon className="size-4 text-white"/>
          </Button>
        )}
      </div>
    </div>
  )
}
```

# Chapter 33 Subscriptions list

## Requirements

display the recent subscribed user in the sidebar

and add a all subscription button , when click it ,it will display all the subscribed users 

## Workflow

![image-20250811224442947](/Users/a1/Library/Application Support/typora-user-images/image-20250811224442947.png)

## Create subscriptions "getMany" procedure

### src/modules/subscriptions/server/procdure.ts

```ts
getMany:protectedProcedure
    .input(
      z.object({   
        cursor:z.object({
          creatorId:z.string().uuid(),
          updatedAt:z.date(),
        })
        .nullish(),
        limit:z.number().min(1).max(100),
      })
    )
    .query(async({input,ctx})=>{
      const {cursor,limit}=input;
      const {id:userId}=ctx.user;
      const data=await db
        .select({
          ...getTableColumns(subscriptions),
          user:{
            ...getTableColumns(users),
          subscriberCount:db.$count(
            subscriptions,
            eq(subscriptions.creatorId,users.id)
          )
          }
        })
        .from(subscriptions)
        .innerJoin(users,eq(subscriptions.creatorId,users.id))
        .where(and(
          eq(subscriptions.viewerId,userId),
          cursor
            ? or(
              lt(subscriptions.updatedAt,cursor.updatedAt),
              and(
                eq(subscriptions.updatedAt,cursor.updatedAt),
                lt(subscriptions.creatorId,cursor.creatorId)
              ))
            :undefined,
          )).orderBy(desc(subscriptions.updatedAt),desc(subscriptions.creatorId))
          // Add 1 to the limit to check if there is more data
          .limit(limit+1)
          const hasMore=data.length >limit
          //remove the last item if there is more data
          const items=hasMore ?data.slice(0,-1):data
          //set the next cursor to the last item if there is more data
          const lastItem=items[items.length-1];
          const nextCursor=hasMore ?
            {
              id:lastItem.creatorId,
              updatedAt:lastItem.updatedAt
            }:null;
        return {
          items,
          nextCursor
        };
    }),
```

## Load recent subscriptions in sidebar

### Create src/modules/home/ui/components/home-sidebar/subscriptions-section.tsx

```tsx
'use client'
import { 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem 
} from '@/components/ui/sidebar'
import { HistoryIcon, ListVideoIcon, ThumbsUp } from 'lucide-react'
import Link from 'next/link'
import React from 'react'
import{useAuth,useClerk} from '@clerk/nextjs'
import { usePathname } from 'next/navigation'
import { trpc } from '@/trpc/client'
import { DEFAULT_LIMIT } from '@/constants'
import { UserAvatar } from '@/components/user-avatar'

export const SubscriptionsSection = () => {
  const pathname=usePathname();
  const {data}=trpc.subscriptions.getMany.useInfiniteQuery(
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
          {data?.pages.flatMap((page)=>page.items).map((subscription)=>(
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
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
```

### src/modules/home/ui/components/home-sidebar/index.tsx

```tsx
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
```

### src/modules/subscriptions/hooks/use-subscription.ts

```ts
 const subscribe=trpc.subscriptions.create.useMutation({
    onSuccess:()=>{
      utils.subscriptions.getMany.invalidate();}
    })

 const unsubscribe=trpc.subscriptions.remove.useMutation({
    onSuccess:()=>{
      utils.subscriptions.getMany.invalidate();}
    })  
```

## Create all subscriptions page

### src/modules/home/ui/components/home-sidebar/subscription.tsx

```tsx
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
```

### create src/app/(home)/subscriptions/page.tsx

```tsx
import { DEFAULT_LIMIT } from '@/constants'
import { SubscriptionsView } from '@/modules/subscriptions/ui/views/subscriptions-view'
import { HydrateClient, trpc } from '@/trpc/server'
import React from 'react'

const Page = () => {
  void trpc.subscriptions.getMany.prefetchInfinite({
    limit:DEFAULT_LIMIT,
  })
  return (
   <HydrateClient>
    <SubscriptionsView/>
   </HydrateClient>
  )
}

export default Page
```

### create src/modules/subscriptions/ui/views/subscriptions-view.tsx

```tsx
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

```

### create/src/modules/subscriptions/ui/sections/subscriptions-section.tsx

```tsx
"use client"
import { InfiniteScroll } from "@/components/infinite-scroll";
import { DEFAULT_LIMIT } from "@/constants";
import { VideoGridCard, VideoGridCardSkeleton } from "@/modules/videos /ui/components/video-grid-card";
import { VideoRowCard, VideoRowCardSkeleton } from "@/modules/videos /ui/components/video-row-card";
import { trpc } from "@/trpc/client";
import Link from "next/link";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { toast } from "sonner";
import { SubscriptionItem } from "../components/subscription-item";


export const SubscriptionsSection=()=>{
  return(
    <Suspense fallback={<SubscriptionsSectionSkeleton/>}>
    <ErrorBoundary fallback={<p>Error</p>}>
      <SubscriptionsSectionSuspense/>
    </ErrorBoundary>
  </Suspense>
  )
}

const SubscriptionsSectionSkeleton=()=>{
  return (
    <div>
      <div className="gap-2 gap-y-2 flex flex-col md:hidden" >
        {Array.from({length:18}).map((_,index)=>(
            <VideoGridCardSkeleton key={index} />
          ))
          }
      </div>
      <div className="gap-2 gap-y-2 hidden flex-col md:flex " >
        {Array.from({length:18}).map((_,index)=>(
            <VideoRowCardSkeleton key={index} size="compact"/>
          ))
          }
      </div>
    </div>
    
  )
}

const SubscriptionsSectionSuspense=()=>{
  const utils=trpc.useUtils();
  const [subscriptions,query] =trpc.subscriptions.getMany.useSuspenseInfiniteQuery(
    {limit:DEFAULT_LIMIT},
  {
    getNextPageParam:(lastPage)=>lastPage.nextCursor,
  }
  );
  const unsubscribe=trpc.subscriptions.remove.useMutation({
    onSuccess:(data)=>{
      toast.success("Unsubscribed");
      //TODO:reinvalidate subscriptions.getMany ,users.getOne
      utils.videos.getManySubscribed.invalidate();
      utils.users.getOne.invalidate({id:data.creatorId});
      utils.subscriptions.getMany.invalidate();
    },
    onError:()=>{
      toast.error("Something went wrong");
    }
  })
  return(
    <div>
      <div className="flex flex-col gap-4 " >
        {subscriptions.pages
          .flatMap((page)=>page.items)
          .map((subscription)=>(
            <Link key={subscription.creatorId} href={`/users/${subscription.user.id}`}>
              <SubscriptionItem
                name={subscription.user.name}
                imageUrl={subscription.user.imageUrl}
                subscriberCount={subscription.user.subscriberCount}
                onUnsubscribe={()=>{
                  unsubscribe.mutate({userId:subscription.creatorId})
                }}
                disabled={unsubscribe.isPending}
              />
            </Link>
          ))
          }
      </div>
      <InfiniteScroll
      hasNextPage={query.hasNextPage}
      isFetchingNextPage={query.isFetchingNextPage}
      fetchNextPage={query.fetchNextPage}
      />
    </div>
  )
  
}
```

### create src/modules/subscriptions/ui/components/subscription-item.tsx

```tsx
import { UserAvatar } from "@/components/user-avatar";
import { SubscriptionButton } from "./subscription-button";
import { Skeleton } from "@/components/ui/skeleton";

interface SubscriptionItemProps{
  name:string;
  imageUrl:string;
  subscriberCount:number;
  onUnsubscribe:()=>void;
  disabled:boolean;
}

export const SubscriptionItemSkeleton=()=>{
  return(
    <div className="flex items-start gap-4">
      <Skeleton className="size-10 rounded-full"/>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-4 w-24"/>
            <Skeleton className="mt-1 h-3 w-20"/>
          </div>
          <Skeleton className="h-8 w-20"/>
        </div>
      </div>
    </div>
  )
}

export const SubscriptionItem=({
  name,
  imageUrl,
  subscriberCount,
  onUnsubscribe,
  disabled,
}:SubscriptionItemProps)=>{
  return (
    <div className="flex items-start gap-4">
      <UserAvatar
        size="lg"
        imageUrl={imageUrl}
        name={name}
      />
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm">
              {name}
            </h3>
            <p className="text-xs text-muted-foreground">
              {subscriberCount.toLocaleString()} subscribers
            </p>
          </div>
          <SubscriptionButton
            size="sm"
            onClick={(e)=>{
              e.preventDefault();
              onUnsubscribe();
            }}
            disabled={disabled}
            isSubscribed
          />
        </div>
      </div>
    </div>
  )
}
```

### create/src/modules/subscriptions/ui/sections/subscriptions-section.tsx

```tsx
const SubscriptionsSectionSkeleton=()=>{
  return (
      <div className="flex flex-col gap-4 " >
        {Array.from({length:18}).map((_,index)=>(
            <SubscriptionItemSkeleton key={index} />
          ))
          }
      </div>
  )
}
```

# Chapter 34 Notification

## Requirements

想给我的YouTube Clone添加一个消息通知系统/首先在home页面的导航栏处有一个通知icon,然后icon会显示通知消息的数字.点击进去是一个消息列表.仅有以下几种消息通知: 视频点赞(谁给谁的哪个视频点赞了) 视频评论(谁给谁的哪个视频评论了什么) 评论点赞(谁给谁的哪个评论点赞了) ,回复评论(谁给谁回复了什么)点击这些消息均会被定位到相对应地地方,如被点赞的视频页面,评论,被点赞的评论
In our home navbar,we will add a notification icon,this icon will display all notifiction counts(decreased when you read a specific  notification )
when you click this icon,you will go to a notification page ,display all notifications in a row list
and we only have video like, comment,comment like,replies those three types notification 

After you clicked one notification ,you will be direct to the related page or position,and do some operations

## Workflow

![image-20250817034207918](/Users/a1/Library/Application Support/typora-user-images/image-20250817034207918.png)

![image-20250817034222129](/Users/a1/Library/Application Support/typora-user-images/image-20250817034222129.png)

## Create notification schema

### src/db/schema.ts

```ts
export const userRelations=relations(users,({many})=>({
  videos:many(videos),
  videoViews:many(videoViews),
  videoReactions:many(videoReactions),
  subscriptions:many(subscriptions,{
    relationName:"subscriptions_viewer_id_fkey"
  }),
  subscribers:many(subscriptions,{
    relationName:"subscriptions_creator_id_fKey"
  }),
  comments:many(comments),
  commentReactions:many(commentReactions),
  playlists:many(playlists),
  sentNotifications: many(notifications, { 
    relationName: "notification_sender" 
  }),
  receivedNotifications: many(notifications, { 
    relationName: "notification_recipient" 
  }),
}))

xport const videoRelations=relations(videos,({one,many})=>({
  user:one(users,{
    fields:[videos.userId],
    references:[users.id]
  }),
  category:one(categories,{
    fields:[videos.categoryId],
    references:[categories.id]
  }),
  views:many(videoViews),
  reactions:many(videoReactions),
  comments:many(comments),
  playlistVideos:many(playlistVideos),
  notifications: many(notifications), 
}))


// 更新评论关系
export const commentRelations = relations(comments, ({ one, many }) => ({
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
  video: one(videos, {
    fields: [comments.videoId],
    references: [videos.id],
  }),
  parent: one(comments, {
    fields: [comments.parentId],
    references: [comments.id],
    relationName: "comments_parent_id_fkey",
  }),
  root: one(comments, {
    fields: [comments.rootId],
    references: [comments.id],
    relationName: "comments_root_id_fkey",
  }),
  reactions: many(commentReactions),
  replies: many(comments, {
    relationName: "comments_parent_id_fkey",
  }),
  notifications: many(notifications), 
}));


// 在 pgEnum 部分添加通知类型
export const notificationType = pgEnum("notification_type", [
  "video_like", 
  "video_comment", 
  "comment_like",
  "comment_reply",
]);

// 通知表
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: notificationType("type").notNull(),
  senderId: uuid("sender_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  recipientId: uuid("recipient_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  videoId: uuid("video_id").references(() => videos.id, { onDelete: "cascade" }),
  commentId: uuid("comment_id").references(() => comments.id, { onDelete: "cascade" }),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("notifications_recipient_idx").on(t.recipientId),
  index("notifications_read_idx").on(t.read),
]);

// 通知关系
export const notificationRelations = relations(notifications, ({ one }) => ({
  sender: one(users, {
    fields: [notifications.senderId],
    references: [users.id],
    relationName: "notification_sender"
  }),
  recipient: one(users, {
    fields: [notifications.recipientId],
    references: [users.id],
    relationName: "notification_recipient"
  }),
  video: one(videos, {
    fields: [notifications.videoId],
    references: [videos.id]
  }),
  comment: one(comments, {
    fields: [notifications.commentId],
    references: [comments.id]
  }),
```

## Create notification procedure

### create src/modules/notifications/server/procedures.ts

```ts
// 在 routers 目录下创建 notification.ts
import { db } from '@/db';
import { comments, notifications, users, videos } from '@/db/schema';
import { createTRPCRouter, protectedProcedure } from '@/trpc/init';
import { trpc } from '@/trpc/server';
import { TRPCError } from '@trpc/server';
import { and, desc, eq, lt, or, sql ,getTableColumns} from 'drizzle-orm';
import { z } from 'zod';


export const notificationRouter = createTRPCRouter({
  // 在 notificationRouter 中添加 create 过程
  create: protectedProcedure
    .input(z.object({
      type: z.enum(["video_like", "video_comment", "comment_like","comment_reply"]),
      senderId: z.string().uuid(),
      recipientId: z.string().uuid(),
      videoId: z.string().uuid().optional(),
      commentId: z.string().uuid().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // 验证通知数据完整性
      if (input.type === "video_like" && !input.videoId) {
        throw new Error("Video ID is required for video_like notification");
      }
      
      if (input.type === "video_comment" && (!input.videoId || !input.commentId)) {
        throw new Error("Video ID and Comment ID are required for video_comment notification");
      }
      
      if (input.type === "comment_like" && (!input.commentId || !input.videoId)) {
        throw new Error("Video ID and Comment ID are required for comment_like notification");
      }
      if (input.type === "comment_reply" && (!input.commentId || !input.videoId)) {
        throw new Error("Video ID and Comment ID are required for comment_reply notification");
      }
      
      // 创建通知
      const [notification] = await db.insert(notifications).values({
        type: input.type,
        senderId: input.senderId,
        recipientId: input.recipientId,
        videoId: input.videoId,
        commentId: input.commentId,
        read: false
      }).returning();
      
      // 触发实时更新
      (globalThis as any).notificationEmitter.emit('new', notification);
      
      return notification;
    }),
  // 获取未读通知数量
  getUnreadCount: protectedProcedure
  .query(async ({ ctx }) => {
    const {id:userId}=ctx.user;
    const result = await  
    db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(
        and(
          eq(notifications.recipientId, userId),
          eq(notifications.read, false)
        )
      );
      return result[0]?.count ?? 0;
  }),

  // 获取通知列表
  getAll: protectedProcedure
    .input(z.object({
      cursor:z.object({
        id:z.string().uuid(),
        createdAt:z.date(),
      })
      .nullish(),
      limit:z.number().min(1).max(100),
    }))
    .query(async ({ ctx, input }) => {
      const { limit, cursor } = input;
      const {id:userId}=ctx.user;
      const data = await db
        .select({
          notification: getTableColumns(notifications),
          sender:users,
          comment:comments,
          video:videos,
        })
        .from(notifications)
        .leftJoin(users, eq(notifications.senderId, users.id))
        .leftJoin(videos, eq(notifications.videoId, videos.id))
        .leftJoin(comments, eq(notifications.commentId, comments.id))
        .where(and(eq(notifications.recipientId, userId),
        cursor 
        ? or(
          lt(notifications.createdAt,cursor.createdAt),
          and(
            eq(notifications.createdAt,cursor.createdAt),
            lt(notifications.id,cursor.id)
          ))
        :undefined,
        ))
        .orderBy(desc(notifications.createdAt))
        .limit(limit + 1)
        const hasMore=data.length >limit
          //remove the last item if there is more data
          const items=hasMore ?data.slice(0,-1):data
          //set the next cursor to the last item if there is more data
          const lastItem=items[items.length-1];
          const nextCursor=hasMore ?
            {
              id:lastItem.notification.id,
              createdAt:lastItem.notification.createdAt,
            }:null;
      return {
        items,
        nextCursor,
      };
    }),    


    // 标记单个通知为已读
    markOneAsRead: protectedProcedure
      .input(z.object({
        id: z.string().uuid(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id } = input;
        await db.update(notifications)
          .set({ read: true })
          .where(and(
            eq(notifications.id, id),
            eq(notifications.recipientId, ctx.user.id) // 确保用户只能操作自己的通知
          )) 
      }),
    
    // 标记所有通知为已读
    markAllAsRead: protectedProcedure
      .mutation(async ({ ctx }) => {
        await db.update(notifications)
          .set({ read: true })
          .where(eq(notifications.recipientId, ctx.user.id));
      }),
      remove: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const { id } = input;
      const { id: userId } = ctx.user;
      
      // 删除通知（确保用户只能删除自己的通知）
      const [deletedNotification] = await db
        .delete(notifications)
        .where(and(
          eq(notifications.recipientId, userId), // 确保是当前用户的通知
          eq(notifications.id, id)
        ))
        .returning();
      
      if (!deletedNotification) {
        throw new TRPCError({ 
          code: "NOT_FOUND"
        });
      }
      return deletedNotification;
    }),
  });

```

### src/modules/video-reactions/server/procedure.tsx

```tsx
export const videoReactionsRouter=createTRPCRouter({
  like:protectedProcedure
    .input(z.object({videoId:z.string().uuid()}))
    .mutation(async({input,ctx})=>{
      const {videoId}=input;
      const {id:userId}=ctx.user;
      // 1. 获取视频所有者
    const videoOwner = await db
    .select({ userId: videos.userId })
    .from(videos)
    .where(eq(videos.id, videoId))
    .then(rows => rows[0]?.userId);
  
  if (!videoOwner) throw new Error("video not exist");
      // The way of tracking views is going to be only for logged in users and only one view per user
      const [existingVideoReactionLike]=await  db
        .select()
        .from(videoReactions)
        .where(
          and(
            eq(videoReactions.videoId,videoId),
            eq(videoReactions.userId,userId),
            eq(videoReactions.type,"like")
          )
        );
        //removing our like
        if(existingVideoReactionLike){
          const [deletedViewerReaction]=await db
             .delete(videoReactions)
             .where(
              and(
                eq(videoReactions.userId,userId),
                eq(videoReactions.videoId,videoId),
              )
             ) 
             .returning();
             // 发送通知（如果不是自己的视频）
              if (videoOwner !== userId) {
                await db.insert(notifications).values({
                  type: "video_like",
                  senderId: userId,
                  recipientId: videoOwner,
                  videoId,
                  read: false,
                  createdAt: new Date()
                });
              }
             return deletedViewerReaction;
        }
        const [createVideoReaction]= await db
           .insert(videoReactions)
           .values({userId,videoId,type:"like"}) 
           //当我们之前已经点击过dislike时，会发生冲突，所以会重新设置为like
           .onConflictDoUpdate({
            target:[videoReactions.userId,videoReactions.videoId],
            set:{
              type:"like",
            },
           })
           .returning()
        return createVideoReaction;
    }), 
```

### src/modules/comments/server/procedure.ts

```ts
  // 修改 create 过程
create: protectedProcedure
.input(
  z.object({
    parentId: z.string().uuid().nullish(),
    videoId: z.string().uuid(),
    value: z.string(),
  }),
)
.mutation(async ({ input, ctx }) => {
  const { videoId, value, parentId } = input;
  const { id: userId } = ctx.user;
  // 1. 获取视频所有者
  const videoOwner = await db
  .select({ userId: videos.userId })
  .from(videos)
  .where(eq(videos.id, videoId))
  .then(rows => rows[0]?.userId);

  if (!videoOwner) throw new TRPCError({ code: "NOT_FOUND", message: "video not exist" });
  let rootId: string | null = null;
  let parentCommentOwnerId: string | null = null; // 新增：存储被回复评论的作者ID

  if (parentId) {
    // 获取父评论以确定 rootId
    const [parentComment] = await db
      .select()
      .from(comments)
      .where(eq(comments.id, parentId));

    if (!parentComment) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    // 如果父评论有 rootId，则使用它，否则使用父评论 ID
    rootId = parentComment.rootId || parentComment.id;
    parentCommentOwnerId = parentComment.userId; // 存储被回复评论的作者ID
  }

  const [createdComment] = await db
    .insert(comments)
    .values({ 
      userId, 
      videoId, 
      value, 
      parentId: parentId || null,
      rootId // 设置 rootId
    })
    .returning();
      // 4. 发送通知
  if (parentId) {
    // 发送回复通知（如果不是回复自己）
    if (parentCommentOwnerId && parentCommentOwnerId !== userId) {
      await db.insert(notifications).values({
        type: "comment_reply",
        senderId: userId,
        recipientId: parentCommentOwnerId, // 通知被回复的用户
        videoId,
        commentId: createdComment.id,
        read: false,
        createdAt: new Date()
      });
    }
  } else {
    // 只对顶级评论发送视频评论通知（如果不是给自己的视频评论）
    if (videoOwner !== userId) {
      await db.insert(notifications).values({
        type: "video_comment",
        senderId: userId,
        recipientId: videoOwner, // 通知视频作者
        videoId,
        commentId: createdComment.id,
        read: false,
        createdAt: new Date()
      });
    }
  }
  return createdComment;
}),
```

### src/modules/comment-reactions/server/procedure.tsx

```tsx
export const commentReactionsRouter=createTRPCRouter({
  like:protectedProcedure
    .input(z.object({
      commentId:z.string().uuid(),
      videoId:z.string().uuid(),
    }))
    .mutation(async({input,ctx})=>{
      const {commentId,videoId}=input;
      const {id:userId}=ctx.user;
      // 1. 获取评论所有者
      const commentOwner = await db
        .select({ userId: comments.userId })
        .from(comments)
        .where(eq(comments.id, commentId))
        .then(rows => rows[0]?.userId);
      
      if (!commentOwner) throw new TRPCError({ code: "NOT_FOUND", message: "评论不存在" });
      // The way of tracking views is going to be only for logged in users and only one view per user
      const [existingCommentReactionLike]=await  db
        .select()
        .from(commentReactions)
        .where(
          and(
            eq(commentReactions.commentId,commentId),
            eq(commentReactions.videoId,videoId),
            eq(commentReactions.userId,userId),
            eq(commentReactions.type,"like")
          )
        );
        //removing our like
        if(existingCommentReactionLike){
          const [deletedCommentReaction]=await db
             .delete(commentReactions)
             .where(
              and(
                eq(commentReactions.userId,userId),
                eq(commentReactions.videoId,videoId),
                eq(commentReactions.commentId,commentId),
              )
             ) 
             .returning();
             return deletedCommentReaction;
        }
        const [createCommentReaction]= await db
           .insert(commentReactions)
           .values({userId,videoId,commentId,type:"like"}) 
           //当我们之前已经点击过dislike时，会发生冲突，所以会重新设置为like
           .onConflictDoUpdate({
            target:[commentReactions.userId,commentReactions.commentId],
            set:{
              type:"like",
            },
           })
           .returning()
           if (commentOwner !== userId) {
            await db.insert(notifications).values({
              type: "comment_like",
              senderId: userId,
              recipientId: commentOwner,
              videoId,
              commentId,
              read: false,
              createdAt: new Date()
            });
          }
        return createCommentReaction;
    }),  
```

## Create notification ui

### Create modules/home/ui/components/home-navbar/notification-icon.tsx

```tsx
"use client";

import { trpc } from "@/trpc/client";
import { BellIcon } from "lucide-react";
import Link from "next/link";


export const NotificationIcon = () => {
  const { data: unreadCount } = trpc.notification.getUnreadCount.useQuery();
  return (
    <Link href="/notifications" className="relative">
      <BellIcon className="h-6 w-6" />
      {unreadCount && unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
          {unreadCount}
        </span>
      )}
    </Link>
  );
};
```

### src/modules/home/ui/components/home-navbar/index.tsx

```tsx
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
```

### src/app/(home)/notifications/page.tsx

```tsx
import { DEFAULT_LIMIT } from "@/constants"
import Notifications from "@/modules/notifications/ui/components/notification"
import { HydrateClient, trpc } from "@/trpc/server"

const Page = () => {
  void trpc.notification.getAll.prefetchInfinite({
    limit:DEFAULT_LIMIT,
  })
  return (
   <HydrateClient>
    <Notifications/>
   </HydrateClient>
  )
}

export default Page
```

### create src/modules/notifications/ui/components/notification/index.ts

```tsx
"use client";
import { trpc } from '@/trpc/client';
import { DEFAULT_LIMIT } from "@/constants";

import { Button } from '@/components/ui/button'; // 假设使用 UI 组件库
import { Loader2 } from 'lucide-react'; // 加载图标
import { NotificationItem } from './notificationItem';
import { useState } from 'react';

export default function Notifications() {
  const utils = trpc.useUtils();
  const [removingId, setRemovingId] = useState<string | null>(null);
  // 获取通知列表
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = 
    trpc.notification.getAll.useInfiniteQuery(
      { limit: DEFAULT_LIMIT },
      { 
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      }
    );
  
  // 标记单个通知为已读
  const markOneAsRead = trpc.notification.markOneAsRead.useMutation({
    onSuccess: () => {
      utils.notification.getUnreadCount.invalidate();
      utils.notification.getAll.invalidate();
    }
  });

  // 标记所有通知为已读
  const markAllAsRead = trpc.notification.markAllAsRead.useMutation({
    onSuccess: () => {
      utils.notification.getUnreadCount.invalidate();
      utils.notification.getAll.invalidate();
    }
  });
  // 删除通知
  const deleteNotification = trpc.notification.remove.useMutation({
    onSuccess: () => {
      utils.notification.getUnreadCount.invalidate();
      utils.notification.getAll.invalidate();
      setRemovingId(null);
    },
    onError: () => {
      setRemovingId(null);
    }
  });
  // 处理标记单个通知为已读
  const handleMarkOneAsRead = (notificationId: string) => {
    markOneAsRead.mutate({ id: notificationId });
  };

  // 处理标记所有通知为已读
  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate();
  };
 // 处理删除通知
 const handleRemoveNotification = (notificationId: string) => {
  setRemovingId(notificationId);
  deleteNotification.mutate({ id: notificationId });
};

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <Button 
          variant="ghost"
          onClick={handleMarkAllAsRead}
          disabled={markAllAsRead.isPending}
        >
          {markAllAsRead.isPending ? (
            <span className="flex items-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </span>
          ) : (
            "Mark All As Read"
          )}
        </Button>
      </div>

      {!data && isFetchingNextPage ? (
        <div className="text-center py-10">
          <Loader2 className="mx-auto h-8 w-8 animate-spin" />
          <p className="mt-2">Loading Notification...</p>
        </div>
      ) : !data || data.pages[0].items.length === 0 ? (
        <div className="text-center py-10">No Notifications</div>
      ) : (
        <>
          <div className="space-y-4">
            {data.pages.flatMap(page => 
              page.items.map(item => (
                <NotificationItem
                  key={item.notification.id}
                  notification={item.notification}
                  sender={item.sender}
                  video={item.video}
                  comment={item.comment}
                  onMarkRead={() => handleMarkOneAsRead(item.notification.id)}
                  isMarking={markOneAsRead.isPending && markOneAsRead.variables?.id === item.notification.id}
                  onRemove={handleRemoveNotification}
                  isRemoving={deleteNotification.isPending && removingId === item.notification.id}
                />
              ))
            )}
          </div>

          {hasNextPage && (
            <Button 
              variant="outline"
              className="mt-4 w-full"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? (
                <span className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </span>
              ) : (
                "Load More"
              )}
            </Button>
          )}
        </>
      )}
    </div>
  );
}
```

### create src/modules/notifications/components/notification/notificationItem.tsx

```tsx
"use client";
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowRight, X } from 'lucide-react';
import { useState } from 'react';

interface NotificationItemProps {
  notification: {
    id: string;
    type: 'video_like' | 'video_comment' | 'comment_like' | 'comment_reply';
    read: boolean;
    createdAt: Date;
  };
  sender: {
    id: string;
    name: string;
    imageUrl: string;
  } | null;
  video: {
    id: string;
    title: string;
  } | null;
  comment: {
    id: string;
    value: string;
  } | null;
  onMarkRead: () => void;
  isMarking: boolean;
  onRemove: (notificationId: string) => void; // 新增删除回调
  isRemoving: boolean; // 新增删除加载状态
}

export const NotificationItem = ({
  notification,
  sender,
  video,
  comment,
  onMarkRead,
  isMarking,
  onRemove,
  isRemoving,
}: NotificationItemProps) => {
  // 根据通知类型生成跳转链接
  const getNotificationLink = () => {
    if (!video) return '/'; // 回退到首页
    
    switch (notification.type) {
      case 'video_like':
        return `/videos/${video.id}`;
      
      case 'video_comment':
      case 'comment_like':
      case 'comment_reply':
        return comment 
          ? `/videos/${video.id}#commentId=${comment.id}`
          : `/videos/${video.id}`;
      
      default:
        return '/'; 
    }
  };
  
  // 根据通知类型生成消息内容
  const getNotificationMessage = () => {
    if (!sender) return null;
    
    switch (notification.type) {
      case 'video_like':
        return (
          <p>
            <span className="font-semibold">{sender.name}</span>
            {video ? ` liked your video "${video.title}"` : ' liked your video'}
          </p>
        );
      
      case 'video_comment':
        return (
          <div>
            <p>
              <span className="font-semibold">{sender.name}</span>
              {video ? ` commented your video "${video.title}"` : ' commented your video'}
            </p>
            {comment && (
              <p className="mt-1 text-gray-600 italic">"{comment.value}"</p>
            )}
          </div>
        );
      
      case 'comment_like':
        return (
          <div>
            <p>
              <span className="font-semibold">{sender.name}</span>
              {video ? ` liked your comment of "${video.title}" ` : ' liked your comment'}
            </p>
            {comment && (
              <p className="mt-1 text-gray-600 italic">"{comment.value}"</p>
            )}
          </div>
        );
      case 'comment_reply': // 新增回复通知消息
        return (
          <div>
            <p>
              <span className="font-semibold">{sender.name}</span>
              {video ? ` replied your comment of "${video.title}"` : ' replied your comment'}
            </p>
            {comment && (
              <p className="mt-1 text-gray-600 italic">"{comment.value}"</p>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  // 获取跳转链接
  const notificationLink = getNotificationLink();
  
  return (
    <div className={`group/notification p-4 border rounded-lg relative transition-colors cursor-pointer ${
      !notification.read 
        ? 'bg-blue-50 border-blue-200 hover:bg-blue-100' 
        : 'hover:bg-gray-50'
    }`}
      
    >
   {/* 删除按钮 - 使用CSS悬停控制 */}
   <Button 
        size="icon"
        variant="destructive"
        className="absolute bottom-3 right-3 w-4 h-4 rounded-full z-10 hover:bg-black text-white opacity-0 transition-opacity duration-200 group-hover/notification:opacity-100"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(notification.id);
        }}
        disabled={isRemoving}
      >
        {isRemoving ? (
          <Loader2 className="h-4 w-4 animate-spin bg-black rounded-full" />
        ) : (
          <X className="h-4 w-4 bg-black rounded-full" />
        )}
      </Button>
      
      
      <div className="flex items-start gap-3">
        {sender && (
          <img 
            src={sender.imageUrl} 
            alt={sender.name}
            className="w-10 h-10 rounded-full"
          />
        )}
        
        {/* 通知内容包装在链接中 */}
        <Link 
          href={notificationLink}
          className="flex-1 group"
          onClick={(e) => {
            // 点击通知内容时标记为已读
            if (!notification.read) {
              onMarkRead();
            }
          }}
        >
          <div >
            {getNotificationMessage()}
          </div>
          
          <div className="flex items-center mt-1">
            <p className="text-xs text-gray-500">
              {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
            </p>
            <ArrowRight className="ml-2 h-3 w-3 text-gray-400 group-hover:text-blue-500" />
          </div>
        </Link>
        
        <div className="flex flex-col items-end space-y-1">
          {!notification.read && (
            <Button 
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation(); // 阻止事件冒泡
                onMarkRead();
              }}
              disabled={isMarking}
            >
              {isMarking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : "Mark As Read"}
            </Button>
          )}
          
          {!notification.read && (
            <span className="bg-black text-white text-xs px-2 py-0.5 rounded-full">
              unread
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
```

