import Link from "next/link";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { useAuth, useClerk } from "@clerk/nextjs";
import { toast } from "sonner";
import { 
  MessageSquareIcon, 
  MoreVerticalIcon, 
  ThumbsDownIcon, 
  ThumbsUpIcon, 
  Trash2Icon,
  ChevronDownIcon,
  ChevronUpIcon
} from "lucide-react";
import type { CommentsGetManyOutput } from "../../types";
import { trpc } from "@/trpc/client";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { CommentForm } from "./comment-form";
import { CommentReplies } from "./comment-replies";

interface CommentItemProps {
  comment: CommentsGetManyOutput["items"][number];
  depth?: number;
}

export const CommentItem = ({
  comment,
  depth = 0,
}: CommentItemProps) => {
  const clerk = useClerk();
  const { userId } = useAuth();
  const [isReplyOpen, setIsReplyOpen] = useState(false);
  const [isRepliesOpen, setIsRepliesOpen] = useState(false);
  const utils = trpc.useUtils();

  const remove = trpc.comments.remove.useMutation({
    onSuccess: () => {
      toast.success("Comment deleted");
      utils.comments.getMany.invalidate({ videoId: comment.videoId });
    },
    onError: (error) => {
      toast.error("Something went wrong");
      if (error.data?.code === "UNAUTHORIZED") {
        clerk.openSignIn();
      }
    },
  });

  const like = trpc.commentReactions.like.useMutation({
    onSuccess: () => {
      utils.comments.getMany.invalidate({ videoId: comment.videoId });
    },
    onError: (error) => {
      toast.error("Something went wrong");
      if (error.data?.code === "UNAUTHORIZED") {
        clerk.openSignIn();
      }
    },
  });

  const dislike = trpc.commentReactions.dislike.useMutation({
    onSuccess: () => {
      utils.comments.getMany.invalidate({ videoId: comment.videoId });
    },
    onError: (error) => {
      toast.error("Something went wrong");
      if (error.data?.code === "UNAUTHORIZED") {
        clerk.openSignIn();
      }
    },
  });

  const commentTime = formatDistanceToNow(comment.createdAt, { addSuffix: true });

  // 判断是否为顶级评论
  const isTopLevel = !comment.rootId;

  return (
    <div  
    id={`comment-${comment.id}`} 
    className={cn("space-y-2", !isTopLevel && "ml-10")}>
      <div className="flex gap-4">
        <Link href={`/users/${comment.userId}`}>
          <UserAvatar
            size={isTopLevel ? "lg" : "sm"}
            imageUrl={comment.user.imageUrl}
            name={comment.user.name}
          />
        </Link>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <Link href={`/users/${comment.userId}`}>
              <span className="font-medium text-sm pb-0.5">
                {comment.user.name}
              </span>
            </Link>
            <span className="text-xs text-muted-foreground">
              {commentTime}
            </span>
          </div>
          
          <div className="mt-1">
            {/* 显示回复链（非顶级评论且不是直接回复顶级评论） */}
            {!isTopLevel && comment.parentUser && comment.parentUser.id !== comment.rootId && (
              <span className="text-xs text-muted-foreground mr-2">
                Reply to <span className="text-blue-500">@{comment.parentUser.name}</span>
              </span>
            )}
            <p className="text-sm inline">{comment.value}</p>
          </div>
          
          <div className="flex items-center gap-7 mt-2">
            {/* 点赞部分 */}
            <div className="flex items-center gap-1">
              <Button
                disabled={like.isPending}
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => like.mutate({ commentId: comment.id, videoId: comment.videoId })}
              >
                <ThumbsUpIcon
                  className={cn(comment.viewerReaction === "like" && "fill-black")}
                />
              </Button>
              {comment.likeCount > 0 && (
                <span className="text-xs text-muted-foreground">{comment.likeCount}</span>
              )}
            </div>
            
            {/* 点踩部分 */}
            <div className="flex items-center gap-1">
              <Button
                disabled={dislike.isPending}
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => dislike.mutate({ commentId: comment.id, videoId: comment.videoId })}
              >
                <ThumbsDownIcon
                  className={cn(comment.viewerReaction === "dislike" && "fill-black")}
                />
              </Button>  
              {comment.dislikeCount > 0 && (
                <span className="text-xs text-muted-foreground">{comment.dislikeCount}</span>
              )} 
            </div>   

            <Button
              variant="ghost"
              size="sm"
              className="h-8"
              onClick={() => setIsReplyOpen(!isReplyOpen)}
            >
              <MessageSquareIcon className="size-4 mr-1" />
              Reply
            </Button>

            {/* 只对顶级评论显示回复数 */}
            {isTopLevel && comment.replyCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8"
                onClick={() => setIsRepliesOpen(!isRepliesOpen)}
              >
                {isRepliesOpen ? (
                  <ChevronUpIcon className="size-4 mr-1" />
                ) : (
                  <ChevronDownIcon className="size-4 mr-1" />
                )}
                {comment.replyCount} replies
              </Button>
            )}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8">
              <MoreVerticalIcon />
            </Button>    
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setIsReplyOpen(true)}>
              <MessageSquareIcon className="size-4 mr-2" />
              Reply
            </DropdownMenuItem>
            {comment.user.clerkId === userId && (
              <DropdownMenuItem onClick={() => remove.mutate({ id: comment.id })}>
                <Trash2Icon className="size-4 mr-2" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {isReplyOpen && (
        <div className="mt-4 pl-14">
          <CommentForm
            variant="reply"
            parentId={comment.id}
            videoId={comment.videoId}
            onCancel={() => setIsReplyOpen(false)}
            onSuccess={() => {
              setIsReplyOpen(false);
              setIsRepliesOpen(true);
              utils.comments.getMany.invalidate({ videoId: comment.videoId });
            }}
          />
        </div>
      )}

      {/* 只对顶级评论显示回复列表 */}
      {isTopLevel && isRepliesOpen && comment.replyCount > 0 && (
        <CommentReplies
          rootId={comment.id} // 使用 rootId 而不是 parentId
          videoId={comment.videoId}
          depth={depth + 1}
        />
      )}
    </div>
  );
};

