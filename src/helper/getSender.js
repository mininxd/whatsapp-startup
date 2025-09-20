import baileys from '@whiskeysockets/baileys';

const { getContentType, generateForwardMessageContent, generateWAMessageFromContent } = baileys;

export async function getSender(sock, m) {
  const M = {};
  const [msg] = m.messages;

  if (!msg) return;

  const from = msg.key.remoteJid;
  const isGroup = from.endsWith('@g.us');
  const type = getContentType(msg.message);

  M.from = from;
  M.isGroup = isGroup;
  M.sender = isGroup ? msg.key.participant : from;
  M.pushName = msg.pushName;
  M.verifiedName = msg.verifiedBizName;

  M.body =
    type === 'conversation' && msg.message.conversation
      ? msg.message.conversation
      : type === 'imageMessage' && msg.message.imageMessage.caption
      ? msg.message.imageMessage.caption
      : type === 'videoMessage' && msg.message.videoMessage.caption
      ? msg.message.videoMessage.caption
      : type === 'extendedTextMessage' && msg.message.extendedTextMessage.text
      ? msg.message.extendedTextMessage.text
      : type === 'buttonsResponseMessage' && msg.message.buttonsResponseMessage.selectedButtonId
      ? msg.message.buttonsResponseMessage.selectedButtonId
      : type === 'listResponseMessage' &&
        msg.message.listResponseMessage.singleSelectReply.selectedRowId
      ? msg.message.listResponseMessage.singleSelectReply.selectedRowId
      : type === 'templateButtonReplyMessage' &&
        msg.message.templateButtonReplyMessage.selectedId
      ? msg.message.templateButtonReplyMessage.selectedId
      : '';

  M.groupMetadata = isGroup ? await sock.groupMetadata(from) : {};

  M.quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
    ? {
        key: msg.message.extendedTextMessage.contextInfo.quotedMessage.key,
        stanza: msg.message.extendedTextMessage.contextInfo.quotedMessage,
        sender: msg.message.extendedTextMessage.contextInfo.participant,
      }
    : null;

  return M;
}
