import {inferRouterOutputs} from "@trpc/server";
import {AppRouter} from "@/trpc/routers/_app";

export type VideoGetOneOutput=
//You're inferring(获取) the return type of the videos.getOne API route and naming it VideoGetOneOutput.
       inferRouterOutputs<AppRouter>["videos"]["getOne"];

//TODO :change to videos getMany       
export type VideoGetManyOutput=
       inferRouterOutputs<AppRouter>["suggestions"]["getMany"];             