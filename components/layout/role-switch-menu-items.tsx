"use client";

import { Loader2, UserCog } from "lucide-react";
import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useRoleSwitch } from "@/hooks/useAuth";
import { ROLE_LABEL_VI } from "@/lib/utils/roleLabels";

/** Dropdown items for switching the active role — renders nothing for single-role accounts. */
export function RoleSwitchMenuItems() {
  const { otherRoles, isSwitching, switchRole } = useRoleSwitch();

  if (otherRoles.length === 0) return null;

  return (
    <>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        {otherRoles.map((role) => (
          <DropdownMenuItem
            key={role}
            disabled={isSwitching}
            onClick={() => switchRole(role)}
          >
            {isSwitching ? <Loader2 className="animate-spin" /> : <UserCog />}
            Chuyển sang {ROLE_LABEL_VI[role]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuGroup>
    </>
  );
}
