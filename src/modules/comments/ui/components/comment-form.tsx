'use client'

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/components/user-avatar";
import { useUser, useClerk } from "@clerk/nextjs";
import { z } from "zod";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { trpc } from "@/trpc/client";
import { commentInsertSchema } from "@/db/schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage
} from "@/components/ui/form";

interface CommentFormProps {
  videoId: string;
  parentId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  variant?: "comment" | "reply";
}

export const CommentForm = ({
  videoId,
  parentId,
  onSuccess,
  onCancel,
  variant = "comment",
}: CommentFormProps) => {
  const clerk = useClerk();
  const { user } = useUser();
  const utils = trpc.useUtils();
  
  const create = trpc.comments.create.useMutation({
    onSuccess: () => {
      // 使顶级评论列表失效
      utils.comments.getMany.invalidate({ videoId, rootId: null });
      
      // 如果是回复，使特定根评论的回复列表失效
      if (variant === "reply" && parentId) {
        // 使用 rootId 参数而不是 parentId
        utils.comments.getMany.invalidate({ videoId, rootId: parentId });
      }
      form.reset();
      toast.success("Comment added");
      onSuccess?.();
    },
    onError: (error) => {
      toast.error("Something went wrong");
      if (error.data?.code === "UNAUTHORIZED") {
        clerk.openSignIn();
      }
    }
  });

  const formSchema = commentInsertSchema.omit({ userId: true });
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      videoId,
      value: "",
      parentId: variant === "reply" ? parentId : undefined,
    },
  });

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    create.mutate({
      ...values,
      parentId: variant === "reply" ? parentId : undefined
    });
  };

  const handleCancel = () => {
    form.reset();
    onCancel?.();
  };

  return (
    <Form {...form}>
      <form 
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex gap-4 group"
      >
        <UserAvatar
          size="lg"
          imageUrl={user?.imageUrl || "/user-placeholder.svg"}
          name={user?.username || "User"}
        />
        <div className="flex-1 flex flex-col gap-2">
          <FormField
            name="value"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder={
                      variant === "reply"
                        ? "Write your reply..."
                        : "Add a comment..."
                    }
                    className="resize-none bg-transparent overflow-hidden min-h-0"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="justify-end gap-2 flex">
            {onCancel && (
              <Button
                variant="ghost"
                type="button"
                onClick={handleCancel}
              >
                Cancel
              </Button>
            )}
            <Button
              disabled={create.isPending}
              type="submit"
              size="sm"
            >
              {variant === "reply" ? "Reply" : "Comment"}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
};