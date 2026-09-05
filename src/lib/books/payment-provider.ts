// Server-only boundary: no route may grant entitlement or accept a UI price.
import "server-only";
export const BOOK_PRODUCT = Object.freeze({id:"hfos-phase1-full-v1.0",amount:19900,currency:"INR",accessMonths:24,maxSessions:2});
export interface BookPaymentProvider { createOrder(): Promise<never>; acceptWebhook(): Promise<never>; }
export const paymentProvider: BookPaymentProvider = {
  async createOrder(){throw new Error("PAYMENTS_DISABLED");},
  async acceptWebhook(){throw new Error("PAYMENTS_DISABLED");},
};
