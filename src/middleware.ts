import { clerkMiddleware,createRouteMatcher } from "@clerk/nextjs/server";
 const isProtectedRouter=createRouteMatcher([
//  add the routes url you want to protect
   '/studio(.*)',
])
 export default clerkMiddleware(async(auth,req)=>{
   if(isProtectedRouter(req)) await auth.protect();
 }); 
export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    //跳过 Next.js 内部机制和静态文件： 为了提高性能，跳过静态资源和内部机制处理。例如，静态图片、CSS 文件等资源不需要身份验证或数据库查询。
    //除非在查询参数中找到：如果 URL 中带有查询参数，则可能运行处理逻辑
    //正则表达式：？！负向先行断言（右侧不能匹配）
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    //始终为 API 路由运行：写API 路由不受跳过规则影响，始终会运行相关逻辑。
    //正则表达式：匹配所有以 /api 或 /trpc 开头的路径，包括后面的任何内容。
    '/(api|trpc)(.*)',
  ],
};