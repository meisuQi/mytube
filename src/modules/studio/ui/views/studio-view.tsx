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

