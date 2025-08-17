import { AlertTriangleIcon } from "lucide-react";
import {VideoGetOneOutput} from "../../types";

interface VideoBannerProps{
  // 声明一个变量或对象字段 status，它的类型等于 VideoGetOneOutput 类型中 muxStatus 这一项的类型。
  status:VideoGetOneOutput['muxStatus'];
}

export const VideoBanner=({status}:VideoBannerProps)=>{
   if(status==="ready") return null;
   return (
    <div className="bg-yellow-500 py-3 px-4 rounded-b-xl flex items-center gap-2">
      <AlertTriangleIcon className="size-4 text-black shrink-0"/>
      {/* line-clamp-1 makes the text display only 1 line and truncates(截断) the rest with an ellipsis（省略号）. */}
      <p className="text-xs md:text-sm font-medium text-black line-clamp-1">
        this video is still being processed.
      </p>
    </div>
   )

}