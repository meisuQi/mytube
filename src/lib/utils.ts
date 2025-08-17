import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatDuration=(duration:number)=>{
  const seconds=Math.floor((duration%60000)/1000);
  const minutes=Math.floor(duration/60000);
  return`${minutes.toString().padStart(2,'0')}:${seconds.toString().padStart(2,'0')}`;
};

export const snakeCaseToTitle=(str:string)=>{
  //\b\w 匹配每个单词的第一个字母。.replace(..., char => char.toUpperCase()) 把这些字母转换为大写
  //\b 表示 “单词边界”\w 表示单个 单词字符，相当于 [a-zA-Z0-9_]。匹配出现在“单词边界”之后的第一个单词字符。
  return str.replace(/_/g," ").replace(/\b\w/g,(char)=>char.toUpperCase())
}

