import { Booking } from "../booking/booking.model";
import { PAYMENT_STATUS } from "../payment/payment.interface";
import { Payment } from "../payment/payment.model";
import { Tour } from "../tour/tour.model";
import { IsActive } from "../user/user.interface";
import { User } from "../user/user.model";

const now = new Date();
const oneWeekAge = new Date(now).setDate(now.getDate() - 7);
const oneMonthAge = new Date(now).setDate(now.getDate() - 30);

const getUserStats = async () => {
  const totalUsersPromise = User.countDocuments();

  const totalActiveUsersPromise = User.countDocuments({ isActive: IsActive.ACTIVE });
  const totalInActiveUsersPromise = User.countDocuments({ isActive: IsActive.INACTIVE });
  const totalBlockedUsersPromise = User.countDocuments({ isActive: IsActive.BLOCKED });

  const newUsersInLastWeekPromise = User.countDocuments({
    createdAt: { $gte: oneWeekAge },
  });

  const newUsersInLastMonthPromise = User.countDocuments({
    createdAt: { $gte: oneMonthAge },
  });

  const usersByRolePromise = User.aggregate([
    // stage -1 : Grouping users by role and count total users in each role
    { $group: { _id: "$role", count: { $sum: 1 } } },
  ]);

  const [totalUsers, totalActiveUsers, totalInActiveUsers, totalBlockedUsers, newUsersInLastWeek, newUsersInLastMonth, usersByRole] =
    await Promise.all([
      totalUsersPromise,
      totalActiveUsersPromise,
      totalInActiveUsersPromise,
      totalBlockedUsersPromise,
      newUsersInLastWeekPromise,
      newUsersInLastMonthPromise,
      usersByRolePromise,
    ]);

  return {
    totalUsers,
    totalActiveUsers,
    totalInActiveUsers,
    totalBlockedUsers,
    newUsersInLastWeek,
    newUsersInLastMonth,
    usersByRole,
  };

  // ----
};

const getTourStats = async () => {
  const totalTourPromise = Tour.countDocuments();

  const totalTourByTourTypePromise = Tour.aggregate([
    // stage -1: connect Tour Type model - lookup stage
    { $lookup: { from: "tourtypes", localField: "tourType", foreignField: "_id", as: "type" } },
    // stage -2: unwind the array to object
    { $unwind: "$type" },
    // stage -3: grouping top type
    { $group: { _id: "$type.name", count: { $sum: 1 } } },
  ]);

  const avgTourCostPromise = Tour.aggregate([
    // stage -1: group the cost from, do sum, and average the sum
    { $group: { _id: null, avgCostFrom: { $avg: "$costFrom" } } },
  ]);

  const totalTourByDivisionPromise = Tour.aggregate([
    // stage -1: connect division model -lookup stage
    { $lookup: { from: "divisions", localField: "division", foreignField: "_id", as: "division" } },
    { $unwind: "$division" },
    { $group: { _id: "$division.name", count: { $sum: 1 } } },
  ]);

  const totalHighestBookedTourPromise = Booking.aggregate([
    // stage -1: Group the tour
    { $group: { _id: "$tour", bookingCount: { $sum: 1 } } },
    // stage -2: sort the tour
    { $sort: { bookingCount: -1 } },
    // stage -3: limit
    { $limit: 5 },
    // stage -4: lookup stage
    {
      $lookup: {
        from: "tours",
        let: { tourId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$_id", "$$tourId"] },
            },
          },
        ],
        as: "tour",
      },
    },
    // stage -5: unwind stage
    { $unwind: "$tour" },
    // stage -6: project stage
    {
      $project: { bookingCount: 1, "tour.tile": 1, "tour.slue": 1 },
    },
  ]);

  const [totalTour, totalTourByTourType, avgTourCost, totalTourByDivision, totalHighestBookedTour] = await Promise.all([
    totalTourPromise,
    totalTourByTourTypePromise,
    avgTourCostPromise,
    totalTourByDivisionPromise,
    totalHighestBookedTourPromise,
  ]);

  return { totalTour, totalTourByTourType, avgTourCost, totalTourByDivision, totalHighestBookedTour };

  // -----
};

const getBookingStats = async () => {
  const totalBookingPromise = Booking.countDocuments();

  const totalBookingByStatusPromise = Booking.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]);

  const bookingsPerTourPromise = Booking.aggregate([
    // stage -1: group
    { $group: { _id: "$tour", bookingCount: { $sum: 1 } } },
    // stage -2: decending order
    { $sort: { bookingCount: -1 } },
    // stage -3: limit
    { $limit: 10 },
    // stage -4: lookup stage
    {
      $lookup: {
        from: "tours",
        localField: "tour",
        foreignField: "_id",
        as: "tour",
      },
    },
    // stage -5: unwind stage
    {
      $unwind: "$tour",
    },
    // stage -6: project stage
    {
      $project: {
        bookingCount: 1,
        _id: 1,
        "tour.tile": 1,
        "tour.slug": 1,
      },
    },
  ]);

  const avgGuestCountPerBookingPromise = Booking.aggregate([
    // stage -1: gourp stage
    {
      $group: { _id: null, avgGuestCount: { $avg: "$guestCount" } },
    },
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalBookingByUniqueUsersPromise = Booking.distinct("user").then((user: any) => user.length);

  const bookingsLastWeekPromise = Booking.countDocuments({ createdAt: { $gte: oneWeekAge } });
  const bookingsLastMonthPromise = Booking.countDocuments({ createdAt: { $gte: oneMonthAge } });

  const [
    totalBooking,
    totalBookingByStatus,
    bookingsPerTour,
    avgGuestCountPerBooking,
    bookingsLastWeek,
    bookingsLastMonth,
    totalBookingByUniqueUsers,
  ] = await Promise.all([
    totalBookingPromise,
    totalBookingByStatusPromise,
    bookingsPerTourPromise,
    avgGuestCountPerBookingPromise,
    bookingsLastWeekPromise,
    bookingsLastMonthPromise,
    totalBookingByUniqueUsersPromise,
  ]);

  return {
    totalBooking,
    totalBookingByStatus,
    bookingsPerTour,
    avgGuestCountPerBooking: avgGuestCountPerBooking[0].avgGuestCount,
    bookingsLastWeek,
    bookingsLastMonth,
    totalBookingByUniqueUsers,
  };

  // --------
};

const getPaymentStats = async () => {
  const totalPaymentPromise = Payment.countDocuments();

  const totalPaymentByStatusPromise = Payment.aggregate([
    // stage -1: group stage
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  const totalRevenuePromise = Payment.aggregate([
    // stage -1: match stage
    { $match: { status: PAYMENT_STATUS.PAID } },
    { $group: { _id: null, totalRevenue: { $sum: "$amount" } } },
  ]);

  const paymentGatewayDataPromise = Payment.aggregate([
    // stage -1: group stage
    { $group: { _id: { $ifNull: ["$paymentGatewayData.status", "UNKNOWN"] }, count: { $sum: 1 } } },
  ]);

  const avgTotalAmountPromise = Payment.aggregate([{ $group: { _id: "null", avgPaymentAmount: { $avg: "$amount" } } }]);

  const [totalPayment, totalPaymentByStatus, totalRevenue, avgTotalAmount, paymentGatewayData] = await Promise.all([
    totalPaymentPromise,
    totalPaymentByStatusPromise,
    totalRevenuePromise,
    avgTotalAmountPromise,
    paymentGatewayDataPromise,
  ]);

  return { totalPayment, totalPaymentByStatus, totalRevenue, avgTotalAmount, paymentGatewayData };

  // -----
};

export const StatsService = {
  getBookingStats,
  getPaymentStats,
  getTourStats,
  getUserStats,
};
