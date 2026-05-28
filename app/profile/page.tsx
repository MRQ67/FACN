import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  if (!user) redirect("/sign-in");

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8">
      <div className="w-full max-w-md space-y-6 rounded-lg border p-8 shadow-sm">
        <div className="flex flex-col items-center gap-4">
          <img
            src={user.imageUrl}
            alt={user.fullName ?? "Profile"}
            className="h-20 w-20 rounded-full"
          />
          <h1 className="text-2xl font-semibold">
            {user.fullName ?? "User"}
          </h1>
          <p className="text-sm text-zinc-500">
            {user.primaryEmailAddress?.emailAddress}
          </p>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-500">User ID</span>
            <span className="font-mono">{user.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Email verified</span>
            <span>
              {user.primaryEmailAddress?.verification?.status === "verified"
                ? "Yes"
                : "No"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
