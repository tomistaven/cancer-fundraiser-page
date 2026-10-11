import { FieldValue, Timestamp } from "firebase-admin/firestore";

const COLLECTION_NAME = "supportRequests";
const PAID_ACCESS_AMOUNT = 30;
const EXPIRES_AT = new Date("2027-02-11T00:00:00+02:00");

export class SupportRequestRepository {
  #collection;

  constructor(firestore) {
    this.#collection = firestore.collection(COLLECTION_NAME);
  }

  async save({ donorName, instagramHandle }) {
    const possibleDuplicate = await this.#handleExists(instagramHandle);

    const reference = await this.#collection.add({
      donorName,
      amount: PAID_ACCESS_AMOUNT,
      instagramHandle,
      submittedAt: FieldValue.serverTimestamp(),
      status: "pending",
      expiresAt: Timestamp.fromDate(EXPIRES_AT),
    });

    return { id: reference.id, possibleDuplicate };
  }

  async #handleExists(instagramHandle) {
    const snapshot = await this.#collection
      .where("instagramHandle", "==", instagramHandle)
      .limit(1)
      .get();

    return !snapshot.empty;
  }
}
