import { IconSparkles } from "@tabler/icons-react";

export function meta() {
  return [
    { title: "<Name>" },
    {
      name: "description",
      content: "<Name> — built on agent-native scaffolding.",
    },
  ];
}

export default function IndexRoute() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-3 px-6 text-center">
      <IconSparkles size={40} className="text-primary" />
      <h1 className="text-2xl font-semibold">Hello from <Name></h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Blank starter — one route, one table, one action. Start building.
      </p>
    </div>
  );
}
