import AppError from "../../errorHelpers/AppError";
import { User } from "../user/user.model";
import { BOOKING_STATUS, IBooking } from "./booking.interface";
import httpStatus from "http-status-codes";
import { Booking } from "./booking.model";
import { Payment } from "../payment/payment.model";
import { PAYMENT_STATUS } from "../payment/payment.interface";
import { Tour } from "../tour/tour.model";
import { SSLService } from "../sslCommerz/sslCommerz.service";
import { ISSLCommerz } from "../sslCommerz/sslCommerz.interface";
import { getTransactionId } from "../../utils/getTransactionId";

const createBooking = async (payload: Partial<IBooking>, userId: string) => {
  const session = await Booking.startSession();
  session.startTransaction(); // transaction start

  try {
    const user = await User.findById(userId);

    if (!user?.phone || !user.address) {
      throw new AppError(httpStatus.BAD_REQUEST, "Please Update Your Profile to Book a Tour.");
    }

    const tour = await Tour.findById(payload.tour).select("costFrom");

    if (!tour?.costFrom) {
      throw new AppError(httpStatus.BAD_REQUEST, "No Tour Cost Found!");
    }

    const booking = await Booking.create(
      [
        {
          user: userId,
          status: BOOKING_STATUS.PENDING,
          ...payload,
        },
      ],
      { session }
    );

    const amount = Number(tour.costFrom) * Number(payload.guestCount as number);

    const transactionId = getTransactionId();
    const payment = await Payment.create(
      [
        {
          booking: booking[0]._id,
          status: PAYMENT_STATUS.UNPAID,
          transactionId: transactionId,
          amount: amount,
        },
      ],
      { session }
    );

    const updatedBooking = await Booking.findByIdAndUpdate(
      booking[0]._id,
      { payment: payment[0]._id },
      { new: true, runValidators: true, session }
    )
      .populate("user", "name email phone address")
      .populate("tour", "title costFrom")
      .populate("payment");

    const userAddress = await (updatedBooking?.user as any).address;
    const userEmail = await (updatedBooking?.user as any).email;
    const userPhone = await (updatedBooking?.user as any).phone;
    const userName = await (updatedBooking?.user as any).name;

    const sslPayload = {
      address: userAddress,
      email: userEmail,
      phoneNumber: userPhone,
      name: userName,
      amount,
      transactionId,
    };

    const sslPayment: ISSLCommerz = await SSLService.sslPaymentInit(sslPayload);

    // console.log(sslPayment);

    await session.commitTransaction(); // transaction
    session.endSession();

    return {
      paymentUrl: sslPayment.GatewayPageURL,
      
      booking: updatedBooking,
    };
  } catch (err: any) {
    await session.abortTransaction(); // rollback
    session.endSession();

    throw err;

    // start over
  }
};

// frontend(localhost://5173) - User -tour -booking(pending) - payment(unpaid) - sslcommerz page - payment  complete - backend(localhost://5000) - update payment(paid) & booking (confirm) - redirect to frontend(localhost://5173/payment/success)

// frontend(localhost://5173) - User -tour -booking(pending) - payment(unpaid) - sslcommerz page - payment  failed/ cancel - backend(localhost://5000) - update payment(failed/cancel) & booking (fail/cancel) - redirect to frontend(localhost://5173/payment/cancel or fail)

const getUserBookings = async () => {
  return {};
};

const getBookingById = async () => {
  return {};
};

const updateBookingStatus = async () => {
  return {};
};

const getAllBookings = async () => {
  return {};
};

export const BookingService = {
  createBooking,
  getUserBookings,
  getBookingById,
  updateBookingStatus,
  getAllBookings,
};
