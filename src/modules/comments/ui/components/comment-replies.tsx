'use client'

import { DEFAULT_LIMIT } from "@/constants";
import { trpc } from "@/trpc/client";
import { Loader2Icon } from "lucide-react";
import { CommentItem } from "./comment-item";
import { Button } from "@/components/ui/button";
import type { CommentsGetManyOutput } from "../../types";

interface CommentRepliesProps {
  rootId: string; // 改为 rootId 而不是 parentId
  videoId: string;
  depth?: number;
}

export const CommentReplies = ({
  rootId,
  videoId,
  depth = 0,
}: CommentRepliesProps) => {
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = trpc.comments.getMany.useInfiniteQuery(
    {
      limit: DEFAULT_LIMIT,
      videoId,
      rootId, // 使用 rootId 查询
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );

  return (
    <div className="mt-2">
      <div className="flex flex-col gap-4">
        {isLoading && (
          <div className="flex items-center justify-center">
            <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {!isLoading &&
          data?.pages
            .flatMap((page) => page.items)
            .map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                depth={depth + 1}
              />
            ))}
      </div>
      {hasNextPage && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          className="mt-2"
        >
          {isFetchingNextPage ? (
            <Loader2Icon className="size-4 mr-2 animate-spin" />
          ) : (
            "Show more replies"
          )}
        </Button>
      )}
    </div>
  );
};