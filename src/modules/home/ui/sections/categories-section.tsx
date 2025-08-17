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
