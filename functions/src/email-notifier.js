import { Resend } from "resend";

const PAID_ACCESS_AMOUNT = 30;

export class EmailNotifier {
  #client;
  #from;
  #to;

  constructor({ apiKey, from, to }) {
    this.#client = new Resend(apiKey);
    this.#from = from;
    this.#to = to;
  }

  async notifyNewRequest({ donorName, instagramHandle, possibleDuplicate }) {
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
      lines.push(
        "",
        "Huom: sama Instagram-tunnus on jo pyynnössä. Tämä voi olla päällekkäinen.",
      );
    }

    lines.push(
      "",
      "Tarkista maksu tiliotteesta ennen kuin lisäät henkilön Close Friends -listalle.",
    );

    return lines.join("\n");
  }
}
