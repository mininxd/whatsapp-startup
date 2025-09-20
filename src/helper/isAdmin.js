export function isAdmin(groupMetadata, sender) {
  const groupAdmins = groupMetadata.participants
    .filter((p) => p.admin)
    .map((p) => p.id);

  return groupAdmins.includes(sender);
}
