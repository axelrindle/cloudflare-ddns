/**
 * Send a message via the Telegram Bot API.
 *
 * @param bot The bot token.
 * @param chat The chat ID.
 * @param message A message to send to the given chat ID.
 * @returns The API response.
 * @see https://core.telegram.org/bots/api
 */
export function sendMessage(bot: string, chat: string, message: string) {
    const url = `https://api.telegram.org/bot${bot}/sendMessage`
    const body = {
        chat_id: chat,
        text: message,
    }

    return fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    })
}
