import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/session";
import { HOME_PATH, LOGIN_PATH } from "@/lib/auth/routes";

export default async function Home() {
  redirect((await getCurrentUser()) ? HOME_PATH : LOGIN_PATH);
}
