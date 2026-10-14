import { FieldValue, Timestamp } from "firebase-admin/firestore";

const COLLECTION_NAME = "supportRequests";
const PAID_ACCESS_AMOUNT = 30;
// One month after the collection ends; the Firestore TTL policy deletes records after this.
const EXPIRES_AT = new Date("2027-02-11T00:00:00+02:00");

export class SupportRequestRepository {
  #collection;

  /**
   * @param {import("firebase-admin/firestore").Firestore} firestore Admin SDK Firestore instance.
   */
  constructor(firestore) {
    this.#collection = firestore.collection(COLLECTION_NAME);
  }

  /**
   * Stores a new request with status `pending`. A repeated handle is still stored.
   *
   * @param {{ donorName: string, instagramHandle: string }} fields Validated input.
   * @returns {Promise<{ id: string, possibleDuplicate: boolean }>} The new document ID, and
   *   whether the handle had already been submitted. The flag is not stored; it is only
   *   used in the notification email.
   */
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
