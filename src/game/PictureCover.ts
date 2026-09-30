/** True while something other than the open Boulevard is on screen: a conversation, the Home Menu, an audition or other dialog,
 * a chapter title card, or the menus (the gameplay HUD is hidden there). Ambient extras such as the birds stand still while it
 * is, and carry on where they left off once it clears. */
export function isPictureCovered(doc: Pick<Document, 'querySelector'> = document): boolean {
  return (
    doc.querySelector('dialog[open]') !== null ||
    doc.querySelector('#chapter-title:not([hidden]), #chapter-conclusion:not([hidden]), #play-hud[hidden]') !== null
  );
}
