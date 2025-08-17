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