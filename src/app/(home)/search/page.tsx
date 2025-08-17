import { DEFAULT_LIMIT } from "@/constants";
import { SearchView } from "@/modules/search/ui/views/search-view";
import { HydrateClient, trpc } from "@/trpc/server";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    query: string | undefined;
    categoryId: string | undefined;
    sort: string | undefined; // 添加排序参数
  }>;
}

const Page = async ({ searchParams }: PageProps) => {
  const { query, categoryId, sort } = await searchParams;
  
  // 预取数据
  void trpc.categories.getMany.prefetch();
  void trpc.search.getMany.prefetchInfinite({
    query,
    categoryId,
    sortBy: sort as "default" | "views" | undefined, // 添加排序参数
    limit: DEFAULT_LIMIT,
  });
  
  return (
    <HydrateClient>
      <SearchView query={query} categoryId={categoryId} />
    </HydrateClient>
  );
};

export default Page;