"use client"
import { Button } from '@/components/ui/button'
import { PlusIcon } from 'lucide-react'
import React, { useState } from 'react'
import { PlaylistCreateModal } from '../components/playlist-create-modal'
import { PlaylistsSection } from '../sections/playlists-section'



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
