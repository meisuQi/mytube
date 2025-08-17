import { db } from '@/db';
import { users } from '@/db/schema';
import { ratelimit } from '@/lib/ratelimit';
import { auth } from '@clerk/nextjs/server';
import { initTRPC,TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { cache } from 'react';
import superjson from "superjson";
export const createTRPCContext = cache(async () => {
  const{userId}= await auth();
  return {clerkUserId:userId}
});
export type Context=Awaited<ReturnType<typeof createTRPCContext>>
const t = initTRPC.context<Context>().create({
  transformer: superjson,
});
// Base router and procedure helpers
export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;

//检测你是否logged in
export const protectedProcedure=t.procedure.use(async function isAuthed(opts){
  const{ctx}=opts;
  if(!ctx.clerkUserId){
    throw new TRPCError({code:"UNAUTHORIZED"})
  }
  //就算你已经logged in ，但是出于某些原因，在数据库中并没有找到你
  const [user]= await db
       .select()
       .from(users)
       .where(eq(users.clerkId,ctx.clerkUserId))
       .limit(1);
    if(!user){
      throw new TRPCError({code:"UNAUTHORIZED"})
    }   
    //对用户的操作做速率限制（Rate Limiting），防止短时间内请求过多，保护后端资源。
    //返回的结果是一个对象，里面有 success 字段，表示是否通过限速检查。
    const {success}=await ratelimit.limit(user.id)
    if(!success){
      throw new TRPCError({code:"TOO_MANY_REQUESTS"})
    }
  return opts.next({
    ctx:{
      ...ctx,
      user,
    }
  })
})