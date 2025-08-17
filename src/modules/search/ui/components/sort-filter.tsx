"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FilterIcon } from "lucide-react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";

export const SortFilter = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
    // 获取当前排序参数，默认为 "default"
    const currentSort = searchParams.get("sort") || "default";
  
    const handleSortChange = (sortBy: string) => {
      const params = new URLSearchParams(searchParams);
      
      // 设置排序参数
      params.set("sort", sortBy);
      
      // 导航到新URL
      router.replace(`${pathname}?${params.toString()}`);
    };

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <FilterIcon className="size-4" />
            Filter
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem 
            className={currentSort === "default" ? "bg-accent" : ""}
            onClick={() => handleSortChange("default")}
          >
            Default
          </DropdownMenuItem>
          <DropdownMenuItem 
            className={currentSort === "views" ? "bg-accent" : ""}
            onClick={() => handleSortChange("views")}
          >
            Views
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };
  