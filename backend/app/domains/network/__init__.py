from app.domains.network import service as network_domain
from app.domains.network.service import list_parties

# Re-export service module API for routes: `from app.domains import network as network_domain`
party_member_count = network_domain.party_member_count
list_party_types = network_domain.list_party_types
get_party = network_domain.get_party
create_party = network_domain.create_party
update_party = network_domain.update_party
archive_party = network_domain.archive_party
restore_party = network_domain.restore_party
list_memberships = network_domain.list_memberships
list_memberships_for_user = network_domain.list_memberships_for_user
assign_member = network_domain.assign_member
unassign_member = network_domain.unassign_member
list_roles = network_domain.list_roles
create_custom_role = network_domain.create_custom_role
archive_role = network_domain.archive_role
grant_role = network_domain.grant_role
revoke_role = network_domain.revoke_role
list_user_roles = network_domain.list_user_roles
list_people = network_domain.list_people
ensure_system_roles = network_domain.ensure_system_roles

__all__ = [
    "list_parties",
    "party_member_count",
    "list_party_types",
    "get_party",
    "create_party",
    "update_party",
    "archive_party",
    "restore_party",
    "list_memberships",
    "list_memberships_for_user",
    "assign_member",
    "unassign_member",
    "list_roles",
    "create_custom_role",
    "archive_role",
    "grant_role",
    "revoke_role",
    "list_user_roles",
    "list_people",
    "ensure_system_roles",
]
