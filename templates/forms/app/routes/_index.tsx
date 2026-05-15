import { redirect } from "react-router";
import type { Route } from "./+types/_index";
import { AppLayout } from "@/components/layout/AppLayout";
import { FormsListPage } from "@/pages/FormsListPage";

export function meta() {
  return [
    { title: "Agent-Native Forms" },
    {
      name: "description",
      content:
        "Your AI agent builds, publishes, and analyzes forms alongside you.",
    },
  ];
}

export function loader({}: Route.LoaderArgs) {
  // In workspace mode the app is mounted at /forms, so the framework strips
  // /forms off the request before routing. Redirecting to /forms here would
  // bounce the browser to /forms → strip → /, looping forever. Render the
  // list inline instead.
  if (process.env.AGENT_NATIVE_WORKSPACE === "1") return null;
  return redirect("/forms");
}

export default function Index() {
  return (
    <AppLayout>
      <FormsListPage />
    </AppLayout>
  );
}
