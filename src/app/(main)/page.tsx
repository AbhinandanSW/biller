import { redirect } from "next/navigation";

import { getCurrentUser } from "@/api/auth/session";
import { HOME_PATH, LOGIN_PATH } from "@/constants/routes";

export default async function Home() {
  redirect((await getCurrentUser()) ? HOME_PATH : LOGIN_PATH);
}
