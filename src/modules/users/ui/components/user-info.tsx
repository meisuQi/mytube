import {cva,type VariantProps} from "class-variance-authority";
import {cn} from "@/lib/utils";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

const userInfoVariants=cva("flex items-center gap-1",{
  variants:{
    size:{
      default:"[&_p]:text-sm [&_svg]:size-4",
      lg:"[&-p]:text-base [&_svg]:size-5 [&_svg]:font-medium [&_p]:text-back",
      sm:"[&_p]:text-xs [&_svg]:size-3.5",
    }
  },
  defaultVariants:{
    size:"default",
  },
});
interface UserInfoProps extends VariantProps<typeof userInfoVariants>{
  name:string;
  className?:string;
};
export const UserInfo=({
  name,
  className,
  size
}:UserInfoProps)=>{
  return(
    <div className={cn(userInfoVariants({size,className}))}>
      <Tooltip>
        <TooltipTrigger asChild>
          {/* line-clamp-1：limits text to only 1 line and truncates the rest with an ellipsis. */}
          <p className="text-gray-900 font-semibold hover:text-gray-800 line-clamp-1">
              {name}
          </p>
        </TooltipTrigger>
        <TooltipContent align="center" className="bg-black/70">
          <p>
            {name}
          </p>
        </TooltipContent>
      </Tooltip>
    </div>
  )
}
