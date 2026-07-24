import { inngest } from "@/features/inngest/client";
import { serve } from "inngest/next";
import { processTask } from "./function";
import { reviewPullRequeest } from "@/features/reviews/server/review-pr-function";
import { syncRepoCodebaseFunction } from "@/features/repo-sync/server/repo-sync-function";


export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [processTask, reviewPullRequeest, syncRepoCodebaseFunction],
});