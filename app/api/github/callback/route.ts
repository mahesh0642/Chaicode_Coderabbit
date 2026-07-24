import { saveInstallation } from "@/features/github/server/installation";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

/**
 * GitHub App installation callback.
 *
 * GitHub will redirect the user back to the callback URL configured on the GitHub App.
 * Typical query params include:
 * - state: the value you sent (we use userId)
 * - installation_id: the numeric installation id
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const installationIdRaw = url.searchParams.get("installation_id");
  const state = url.searchParams.get("state");

  // Debug: verify GitHub App callback query params.
  console.log("[github/callback] query", {
    state,
    installation_id: installationIdRaw,
    setup_action: url.searchParams.get("setup_action"),
  });


  if (!state) {
    return NextResponse.json({ error: "Missing state" }, { status: 400 });
  }

  if (!installationIdRaw) {
    return NextResponse.json({ error: "Missing installation_id" }, { status: 400 });
  }

  const installationId = Number(installationIdRaw);
  if (!Number.isFinite(installationId)) {
    return NextResponse.json({ error: "Invalid installation_id" }, { status: 400 });
  }

  try {
    await saveInstallation(state, installationId);
  } catch (e) {
    // Log the real error server-side so we can fix the root cause.
    console.error("[github/callback] saveInstallation failed", e);

    // In development this is essential to debug connection issues.
    const message = e instanceof Error ? e.message : String(e);

    return NextResponse.json(
      { error: "Failed to save installation", details: message },
      { status: 500 }
    );
  }


  // After connecting, send user back to dashboard.
  // If you have a dedicated route for github settings, swap this.
  return redirect("/dashboard/github");
}

