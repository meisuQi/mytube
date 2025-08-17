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
