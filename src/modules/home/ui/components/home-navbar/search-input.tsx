"use client";

import { Button } from "@/components/ui/button";
import { APP_URL } from "@/constants";
import { SearchIcon, XIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useState, useEffect } from "react";

export const SearchInput = () => {
  const router = useRouter();
  const searchParams = useSearchParams();//是键值对（query string）集合，支持 .get()、.set()、.has()、.delete()、.entries() 等方法。
  
  // 从 URL 参数中获取当前值
  const query = searchParams.get("query") || "";
  const categoryId = searchParams.get("categoryId") || "";
  
  // 状态管理输入值
  const [value, setValue] = useState(query);
  
  // 当 URL 参数变化时更新输入值
  useEffect(() => {
    setValue(query);
  }, [query]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newQuery = value.trim();
    const params = new URLSearchParams();//?后面的内容
    
    // 设置查询参数 - 保留空格
    if (newQuery) {
      // 直接设置值，不进行 encodeURIComponent
      params.set("query", newQuery);
    }
    
    // 保留分类ID
    if (categoryId) {
      params.set("categoryId", categoryId);
    }
    
    // 构建 URL 并导航
    const url = `${APP_URL}/search?${params.toString()}`;
    router.push(url);
  };
  
  // 清除搜索
  const handleClear = () => {
    setValue("");
    
    // 如果当前在搜索页面，清除查询参数
    if (window.location.pathname === "/search") {
      const params = new URLSearchParams();
      
      // 保留分类ID
      if (categoryId) {
        params.set("categoryId", categoryId);
      }
      
      const url = `${APP_URL}/search?${params.toString()}`;
      router.push(url);
    }
  };

  return (
    <form className="flex w-full max-w-[600px]" onSubmit={handleSearch}>
      <div className="relative w-full">
        <input 
          value={value}
          onChange={(e) => setValue(e.target.value)}
          type="text"
          placeholder="Search"
          className="w-full pl-4 py-2 pr-12 rounded-l-full border focus:outline-none focus:border-blue-500"  
        />
        
        {/* 清除按钮 */}
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full"
          >
            <XIcon className="text-gray-500 size-5" />
          </Button>
        )}
      </div>
      
      {/* 搜索按钮 - 保持原有样式 */}
      <button
        disabled={!value.trim()} 
        type="submit"
        className='px-5 py-2.5 bg-gray-100 border border-l-0 rounded-r-full hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed'
      >
        <SearchIcon className="size-5" />
      </button>
    </form>
  );
};