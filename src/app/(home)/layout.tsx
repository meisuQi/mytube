import React from 'react'
import { HomeLayout } from '@/modules/home/ui/layouts/home-layout';
export const dynamic ="force-dynamic";
interface LayoutProps{
  children:React.ReactNode;
}
const layout = ({children}:LayoutProps) => {
  return (
    <HomeLayout>
      {children}
    </HomeLayout>
  )
}

export default layout