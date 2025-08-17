import {inferRouterOutputs} from "@trpc/server";
import {AppRouter} from "@/trpc/routers/_app";

export type CommentsGetManyOutput=
//You're inferring(获取) the return type of the videos.getOne API route and naming it VideoGetOneOutput.
       inferRouterOutputs<AppRouter>["comments"]["getMany"];
            

       