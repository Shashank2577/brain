import { IconList } from "@tabler/icons-react";

export function meta() {
  return [{ title: "<Name>" }];
}

export default function ItemsIndex() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <IconList size={40} className="text-muted-foreground" />
      <h1 className="text-xl font-semibold"><Name></h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Select an item from the list — or use the agent to create one.
      </p>
    </div>
  );
}
