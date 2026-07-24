import { createHmac, timingSafeEqual } from "crypto";

import { prisma } from "@/lib/db";

type RazorpaySubscriptionPayload = {
  id: string;
  current_end?: number;
  notes?: { userId?: string };
};

type RazorpayWebhookBody = {
  event: string;
  payload: {
    subscription?: {
      entity: RazorpaySubscriptionPayload;
    };
  };
};

const HANDLED_EVENTS = new Set([
  "subscription.activated",
  "subscription.charged",
  "subscription.cancelled",
  "subscription.halted",
  "subscription.completed",
]);

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("x-razorpay-signature");
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!secret || !signature) {
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  const expected = createHmac("sha256", secret).update(body).digest("hex");
  const signatureBuf = Buffer.from(signature, "utf8");
  const expectedBuf = Buffer.from(expected, "utf8");

  if (
      signatureBuf.length !== expectedBuf.length ||
      !timingSafeEqual(expectedBuf, signatureBuf)
  ) {
      return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: RazorpayWebhookBody;
  try {
    event = JSON.parse(body) as RazorpayWebhookBody;
  } catch {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (!HANDLED_EVENTS.has(event.event)) {
    return Response.json({ received: true });
  }

  const subscription = event.payload.subscription?.entity;
  if (!subscription) {
    return Response.json({ error: "Missing subscription" }, { status: 400 });
  }

    let userId: string | null = null;
  try {
    const existingUser = await prisma.user.findFirst({
      where: { razorpaySubscriptionId: subscription.id },
      select: { id: true },
    });
    userId = existingUser?.id ?? subscription.notes?.userId ?? null;
  } catch (err) {
    console.error("DB lookup error:", err);
    return Response.json({ received: true }); // allow retry if db was down
  }

  if (!userId) {
    console.error(
      "Razorpay webhook: no user for subscription",
      subscription.id,
      event.event
    );
    return Response.json({ received: true });
  }

  const renewsAt = subscription.current_end
    ? new Date(subscription.current_end * 1000)
    : null;

  try {
    switch (event.event) {
      case "subscription.activated":
        await prisma.user.update({
          where: { id: userId },
          data: {
            plan: "pro",
            razorpaySubscriptionId: subscription.id,
            subscriptionStatus: "active",
            subscriptionRenewsAt: renewsAt,
          },
        });
        break;
      case "subscription.charged":
        await prisma.user.update({
          where: { id: userId },
          data: { subscriptionRenewsAt: renewsAt },
        });
        break;
      case "subscription.cancelled":
        await prisma.user.update({
          where: { id: userId },
          data: { subscriptionStatus: "canceled" },
        });
        break;
      case "subscription.halted":
        await prisma.user.update({
          where: { id: userId },
          data: { subscriptionStatus: "halted" },
        });
        break;
      case "subscription.completed":
        await prisma.user.update({
          where: { id: userId },
          data: {
            plan: "free",
            subscriptionStatus: "canceled",
            subscriptionRenewsAt: null,
          },
        });
        break;
    }
  } catch (err) {
    // DB problem: log but do not block webhook handling
    console.error("DB update error:", err, "webhook event:", event.event);
    return Response.json({ received: true });
  }

  return Response.json({ received: true });
}