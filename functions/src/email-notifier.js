import { Resend } from "resend";

const PAID_ACCESS_AMOUNT = 30;

export class EmailNotifier {
  #client;
  #from;
  #to;

  /**
   * @param {{ apiKey: string, from: string, to: string }} options Resend API key, a sender
   *   address on the verified domain, and the recipient address.
   */
  constructor({ apiKey, from, to }) {
    this.#client = new Resend(apiKey);
    this.#from = from;
    this.#to = to;
  }

  /**
   * Sends Tuomas a Finnish plain-text email about a new access request.
   *
   * @param {{ donorName: string, instagramHandle: string, possibleDuplicate: boolean }} details
   * @throws {Error} If Resend rejects the email.
   */
  async notifyNewRequest({ donorName, instagramHandle, possibleDuplicate }) {
    // Resend returns failures as `error` instead of throwing, so the check is explicit.
    const { error } = await this.#client.emails.send({
      from: this.#from,
      to: [this.#to],
      subject: `Uusi Close Friends -pyyntö: @${instagramHandle}`,
      text: this.#buildBody({ donorName, instagramHandle, possibleDuplicate }),
    });

    if (error) {
      throw new Error(`Resend rejected notification: ${error.message}`);
    }
  }

  // Plain text, so a visitor-supplied name cannot inject markup into the email.
  #buildBody({ donorName, instagramHandle, possibleDuplicate }) {
    const lines = [
      "Uusi vastikkeellinen pyyntö (Close Friends).",
      "",
      `Nimi: ${donorName}`,
      `Summa: ${PAID_ACCESS_AMOUNT} €`,
      `Instagram: @${instagramHandle}`,
      `Linkki: https://instagram.com/${instagramHandle}`,
    ];

    if (possibleDuplicate) {
      lines.push("", "Huom: sama Instagram-tunnus on jo pyynnössä. Tämä voi olla päällekkäinen.");
    }

    lines.push("", "Tarkista maksu tiliotteesta ennen kuin lisäät henkilön Close Friends -listalle.");

    return lines.join("\n");
  }
}