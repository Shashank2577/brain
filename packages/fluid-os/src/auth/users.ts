export interface GithubProfile {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
}

export interface FluidUser {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  github?: { id: number; login: string };
  createdAt: number;
}

export interface UserStore {
  byId(id: string): FluidUser | undefined;
  byGithubId(githubId: number): FluidUser | undefined;
  byEmail(email: string): FluidUser | undefined;
  upsertFromGithub(profile: GithubProfile, email: string): FluidUser;
  upsertDev(seed: { id: string; email: string; name: string }): FluidUser;
  list(): FluidUser[];
}

export class MemoryUserStore implements UserStore {
  private byIdMap = new Map<string, FluidUser>();
  private byGithubIdMap = new Map<number, FluidUser>();
  private byEmailMap = new Map<string, FluidUser>();

  byId(id: string) {
    return this.byIdMap.get(id);
  }
  byGithubId(githubId: number) {
    return this.byGithubIdMap.get(githubId);
  }
  byEmail(email: string) {
    return this.byEmailMap.get(email.toLowerCase());
  }
  list() {
    return Array.from(this.byIdMap.values());
  }

  upsertFromGithub(profile: GithubProfile, email: string): FluidUser {
    const existingByGithub = this.byGithubIdMap.get(profile.id);
    if (existingByGithub) {
      existingByGithub.email = email;
      existingByGithub.name = profile.name ?? existingByGithub.name;
      existingByGithub.avatarUrl = profile.avatar_url ?? existingByGithub.avatarUrl;
      this.byEmailMap.set(email.toLowerCase(), existingByGithub);
      return existingByGithub;
    }
    const existingByEmail = this.byEmailMap.get(email.toLowerCase());
    if (existingByEmail) {
      existingByEmail.github = { id: profile.id, login: profile.login };
      existingByEmail.avatarUrl = profile.avatar_url ?? existingByEmail.avatarUrl;
      existingByEmail.name = existingByEmail.name ?? profile.name ?? undefined;
      this.byGithubIdMap.set(profile.id, existingByEmail);
      return existingByEmail;
    }

    const user: FluidUser = {
      id: `u_gh_${profile.id}`,
      email,
      name: profile.name ?? profile.login,
      avatarUrl: profile.avatar_url ?? undefined,
      github: { id: profile.id, login: profile.login },
      createdAt: Date.now(),
    };
    this.byIdMap.set(user.id, user);
    this.byGithubIdMap.set(profile.id, user);
    this.byEmailMap.set(email.toLowerCase(), user);
    return user;
  }

  upsertDev(seed: { id: string; email: string; name: string }): FluidUser {
    const existing = this.byIdMap.get(seed.id);
    if (existing) return existing;
    const user: FluidUser = {
      id: seed.id,
      email: seed.email,
      name: seed.name,
      createdAt: Date.now(),
    };
    this.byIdMap.set(user.id, user);
    this.byEmailMap.set(seed.email.toLowerCase(), user);
    return user;
  }
}
