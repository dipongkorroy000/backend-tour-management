import { Types } from "mongoose";

export enum PAYMENT_STATUS {
  PAID = "PAID",
  UNPAID = "UNPAID",
  CANCELLED = "CANCELLED",
  FAILED = "FAILED",
  REFUNDED = "REFUNDED",
}

export interface IPayment {
  booking: Types.ObjectId;
  transactionId: string;
  amount: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  paymentGatewayData?: any;
  invoice?: string;
  status: PAYMENT_STATUS;
  invoiceUrl?: string;
}
