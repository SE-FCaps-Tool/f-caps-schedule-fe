import GoogleAuthCallbackClient from "./callback-client";

type GoogleAuthCallbackPageProps = {
  searchParams: Promise<{ roles?: string | string[] }>;
};

export default async function GoogleAuthCallbackPage({ searchParams }: GoogleAuthCallbackPageProps) {
  const params = await searchParams;
  const roles = Array.isArray(params.roles) ? params.roles[0] : params.roles;

  return <GoogleAuthCallbackClient rolesParam={roles ?? null} />;
}
