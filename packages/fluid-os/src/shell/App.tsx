import { useEffect, useState } from "react";
import { SignIn } from "./SignIn";
import { Workspace } from "./Workspace";
import { fetchMe } from "./api";
import type { FluidUser } from "./types";

type State = { kind: "loading" } | { kind: "signed-out" } | { kind: "signed-in"; user: FluidUser };

export function App() {
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    fetchMe()
      .then((user) => setState(user ? { kind: "signed-in", user } : { kind: "signed-out" }))
      .catch(() => setState({ kind: "signed-out" }));
  }, []);

  if (state.kind === "loading") {
    return <div className="min-h-screen grid place-items-center text-sm text-muted-foreground">Loading…</div>;
  }
  if (state.kind === "signed-out") return <SignIn />;
  return <Workspace user={state.user} />;
}
