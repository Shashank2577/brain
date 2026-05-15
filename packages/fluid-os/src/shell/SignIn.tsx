import { IconBrandGithub, IconUserCircle } from "@tabler/icons-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Button } from "./components/ui/button";

export function SignIn() {
  return (
    <div className="min-h-screen grid place-items-center px-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Fluid OS</CardTitle>
          <CardDescription className="text-sm">
            An ecosystem of independent agent-native apps that share one identity, one capability registry, and one
            agent.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button asChild className="w-full">
            <a href="/_fluid-os/auth/github" className="inline-flex items-center justify-center gap-2 w-full">
              <IconBrandGithub size={16} />
              Sign in with GitHub
            </a>
          </Button>
          <div className="border-t border-border pt-3">
            <div className="text-xs text-muted-foreground mb-2">Dev mode</div>
            <div className="grid grid-cols-2 gap-2">
              <Button asChild variant="outline" size="sm">
                <a href="/_fluid-os/auth/dev?id=u_alice&email=alice@example.com&name=Alice">
                  <IconUserCircle size={14} />
                  Alice
                </a>
              </Button>
              <Button asChild variant="outline" size="sm">
                <a href="/_fluid-os/auth/dev?id=u_bob&email=bob@example.com&name=Bob">
                  <IconUserCircle size={14} />
                  Bob
                </a>
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">
              Disabled in production. Lets you exercise the OS without configuring GitHub OAuth.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
