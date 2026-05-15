import type { GithubProfile } from "./users.js";

export interface GithubProviderOpts {
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
  fetchImpl?: typeof fetch;
}

const AUTHORIZE_URL = "https://github.com/login/oauth/authorize";
const TOKEN_URL = "https://github.com/login/oauth/access_token";
const USER_URL = "https://api.github.com/user";
const EMAILS_URL = "https://api.github.com/user/emails";

export class GithubProvider {
  private fetchFn: typeof fetch;
  constructor(private opts: GithubProviderOpts) {
    this.fetchFn = opts.fetchImpl ?? fetch;
  }

  authorizeUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.opts.clientId,
      redirect_uri: this.opts.callbackUrl,
      scope: "read:user user:email",
      state,
      allow_signup: "true",
    });
    return `${AUTHORIZE_URL}?${params.toString()}`;
  }

  async exchangeCode(code: string): Promise<string> {
    const res = await this.fetchFn(TOKEN_URL, {
      method: "POST",
      headers: { accept: "application/json", "content-type": "application/json" },
      body: JSON.stringify({
        client_id: this.opts.clientId,
        client_secret: this.opts.clientSecret,
        code,
        redirect_uri: this.opts.callbackUrl,
      }),
    });
    if (!res.ok) throw new Error(`GitHub token exchange failed: ${res.status}`);
    const body = (await res.json()) as { access_token?: string; error?: string; error_description?: string };
    if (!body.access_token) throw new Error(body.error_description ?? body.error ?? "no access_token");
    return body.access_token;
  }

  async fetchProfile(accessToken: string): Promise<{ profile: GithubProfile; email: string }> {
    const headers = {
      authorization: `Bearer ${accessToken}`,
      accept: "application/vnd.github+json",
      "user-agent": "fluid-os",
    };
    const userRes = await this.fetchFn(USER_URL, { headers });
    if (!userRes.ok) throw new Error(`GitHub user fetch failed: ${userRes.status}`);
    const profile = (await userRes.json()) as GithubProfile;

    let email = profile.email ?? "";
    if (!email) {
      const emailsRes = await this.fetchFn(EMAILS_URL, { headers });
      if (emailsRes.ok) {
        const emails = (await emailsRes.json()) as { email: string; primary: boolean; verified: boolean }[];
        const primary = emails.find((e) => e.primary && e.verified) ?? emails.find((e) => e.verified) ?? emails[0];
        email = primary?.email ?? "";
      }
    }
    if (!email) email = `${profile.login}@users.noreply.github.com`;
    return { profile, email };
  }
}
