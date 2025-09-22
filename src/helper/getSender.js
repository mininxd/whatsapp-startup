export function getSender(msg) {
  const jid = msg?.key?.participant || msg?.key?.remoteJid;
  return jid ? jid.split('@')[0] : null;
}
