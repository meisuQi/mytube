"use client";
import { CommentsSection } from "../sections/comments-section";
import { SuggestionsSection } from "../sections/suggestions-section";
import { VideoSection } from "../sections/video-section";
import { useEffect, useRef } from "react";
interface VideoViewProps{
  videoId:string;
  commentId?: string; // 新增：接收commentId
}
export const VideoView=({videoId,commentId}:VideoViewProps)=>{
  
  const scrollAttempts = useRef(0);
  
  useEffect(() => {
    if (!commentId) return;
    
    // 重置尝试计数器
    scrollAttempts.current = 0;
    
    const scrollToComment = () => {
      // 使用正确的ID格式：comment-{id}
      const element = document.getElementById(`comment-${commentId}`);
      
      if (element) {
        // 计算精确的滚动位置
        const headerOffset = 100; // 导航栏高度
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.scrollY - headerOffset;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
        
        // 高亮评论
        element.classList.add('highlight-comment');
        setTimeout(() => {
          element.classList.remove('highlight-comment');
        }, 3000);
      } else {
        // 增加尝试计数
        scrollAttempts.current += 1;
        
        // 最多重试5次
        if (scrollAttempts.current < 5) {
          setTimeout(scrollToComment, 300);
        } else {
          console.warn(`无法定位评论: comment-${commentId}`);
        }
      }
    };
    
    // 初始尝试
    scrollToComment();
    
    // 清理函数
    return () => {
      scrollAttempts.current = 5; // 停止重试
    };
  }, [commentId]);
  return(
    <div className="flex flex-col max-w-[1700px] mx-auto pt-2.5 px-4 mb-10">
      <div className="flex flex-col xl:flex-row gap-6">
        <div className="flex-1 min-w-0">
          <VideoSection videoId={videoId}/>
          <div className="lg:hidden block mt-4">
            {/* rendering on mobile */}
            <SuggestionsSection videoId={videoId} isManual/>
          </div>
          <CommentsSection videoId={videoId} commentId={commentId}/>
        </div>
        <div className="hidden lg:block w-full xl:w-[380px] 2xl:w-[460px] shrink-1">
          {/* rendering on desktop */}
          <SuggestionsSection videoId={videoId}/>
        </div>
      </div>
    </div>
  )
  
}