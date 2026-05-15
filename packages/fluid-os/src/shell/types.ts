export interface FluidUser {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  github?: { id: number; login: string };
}

export interface AppRoute {
  path: string;
  label: string;
}

export interface AppSummary {
  id: string;
  name: string;
  description: string;
  icon?: string;
  url: string;
  routes?: AppRoute[];
  consumes?: string[];
}

export interface CapabilityEntry {
  id: string;
  appId: string;
  description: string;
  tags?: string[];
}
