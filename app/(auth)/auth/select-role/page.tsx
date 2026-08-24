import SelectRoleClient from "./select-role-client";

type SelectRolePageProps = {
  searchParams: Promise<{ roles?: string | string[] }>;
};

export default async function SelectRolePage({ searchParams }: SelectRolePageProps) {
  const params = await searchParams;
  const roles = Array.isArray(params.roles) ? params.roles[0] : params.roles;

  return <SelectRoleClient rolesParam={roles ?? null} />;
}
