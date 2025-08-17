"use client"
import { ResponsiveModal } from '@/components/responsive-dialog';
import { Button } from '@/components/ui/button';
import { trpc } from '@/trpc/client';
import { Loader2Icon, PlusIcon } from 'lucide-react';
import React from 'react'
import { toast } from 'sonner';
import { StudioUploader } from './studio-uploader';
import { useRouter } from 'next/navigation';


const StudioUploadModal = () => {
  const router=useRouter();
  const utils=trpc.useUtils();
  // useMutation() 是一个由 React Query 或 tRPC 提供的 前端 Hook，用于调用服务端的 "变更型操作"（如：创建、更新、删除等）。
  const create =trpc.videos.create.useMutation({  
    onSuccess:()=>{
      toast.success("Video created !")
      utils.studio.getMany.invalidate();
    },
    onError:(error)=>{
      toast.error(error.message)
    }
  });
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
    {/* 它是由 useMutation() 返回的函数，用来触发服务端的变更操作（如：创建、编辑、删除数据）。 */}
    <Button variant="secondary" onClick={()=>create.mutate()} disabled={create.isPending}>
      {/* Loader2Icon：是一个加载图标（通常是个旋转的小圈圈），来自图标库，比如 lucide-react。
      className="animate-spin"：是 Tailwind CSS 提供的一个内建动画类，让元素持续旋转。 */}
      {create.isPending ?<Loader2Icon className="animate-spin"/> :<PlusIcon/>}
      Create
    </Button>
    </>
  )
}

export default StudioUploadModal;