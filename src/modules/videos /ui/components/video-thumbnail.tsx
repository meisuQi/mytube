import { formatDuration } from "@/lib/utils";
import Image from "next/image"
import { THUMBNAIL_FALLBACK } from "../../constants";
import { Skeleton } from "@/components/ui/skeleton";

interface VideoThumbnailProps{
  imageUrl?:string|null;
  previewUrl?:string|null;
  title:string;
  duration:number;
}

export const VideoThumbnailSkeleton=()=>{
  return (
    //aspect-video 是 Tailwind CSS 中的一个实用类名，用于快速设置元素的宽高比为 16:9（常见视频比例）
    <div className="relative w-full overflow-hidden rounded-xl aspect-video">
      <Skeleton className="size-full"/>
    </div>
  )
}

export const VideoThumbnail=({
  imageUrl,
  previewUrl,
  title,
  duration
}:VideoThumbnailProps)=>{
  return (
    <div className="relative group">
      {/* Thumbnail wrapper */}
      {/* aspect-video：是 Tailwind CSS 提供的一个 实用工具类（utility class），用于设置元素的宽高比，尤其适用于视频容器等需要保持固定比例的内容显示。将元素的宽高比设置为 16:9（视频常用比例） */}
      <div className="relative w-full min-h-[100px] overflow-hidden rounded-xl aspect-video">
        {/* fill 图片将填充整个父元素的空间，并且会自动绝对定位来适配这个容器。 */}
        <Image 
        src={ imageUrl ?? THUMBNAIL_FALLBACK }
        alt={title}
        fill 
        priority
        sizes="(max-width: 768px) 100vw, 33vw"
        className="h-full w-full object-cover group-hover:opacity-0"
        />
        <Image 
        /* !!previewUrl 的意思是：「如果 previewUrl 有值，就为 true，否则为 false」。
          2. unoptimized 是什么？
          在 Next.js 的 <Image /> 组件中，unoptimized 是一个布尔属性：
          默认为 false，表示 使用 Next.js 的图片优化功能（例如压缩、懒加载等）。
          如果你设置为 true，表示 跳过图片优化，直接加载原始图片地址。 */
         unoptimized={!!previewUrl}
        src={ previewUrl ?? THUMBNAIL_FALLBACK }
        alt={title}
        fill 
        sizes="(max-width: 768px) 100vw, 33vw"
        className="h-full w-full object-cover opacity-0 group-hover:opacity-100"
        />
      </div>
      {/* Video duration box */}
      <div className="absolute bottom-2 right-2 px-1 py-0.5 rounded bg-black/80 text-white text-xs font-medium">
        {formatDuration(duration)}  
      </div>
    </div>
  );
};