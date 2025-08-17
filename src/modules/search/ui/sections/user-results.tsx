"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { trpc } from "@/trpc/client";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

interface UserResultsProps {
  query: string;
}

export const UserResults = ({ query }: UserResultsProps) => {
  const { data, isLoading } = trpc.search.getUsers.useQuery({ query });
  
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 mt-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-2">
            <Skeleton className="h-12 w-12 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    );
  }

  if (!data?.items?.length) return null;

  return (
    <div className="mt-6">
      <h3 className="text-xl font-semibold mb-4">Relevant user</h3>
      <div className="flex flex-col gap-2">
        {data.items.map((user) => (
          <Link 
            key={user.id} 
            href={`/users/${user.id}`}
            className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Avatar>
              <AvatarImage src={user.avatar || ""} className="object-cover" />
              <AvatarFallback className="bg-gray-200">
                {user.username?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium">{user.username}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};