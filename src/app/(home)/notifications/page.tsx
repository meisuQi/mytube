import { DEFAULT_LIMIT } from "@/constants"
import Notifications from "@/modules/notifications/ui/components/notification"
import { HydrateClient, trpc } from "@/trpc/server"

const Page = () => {
  void trpc.notification.getAll.prefetchInfinite({
    limit:DEFAULT_LIMIT,
  })
  return (
   <HydrateClient>
    <Notifications/>
   </HydrateClient>
  )
}

export default Page