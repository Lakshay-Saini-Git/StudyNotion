
const { instance } = require("../config/razorpay");
const Course = require("../models/Course");
const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const { courseEnrollmentEmail } = require("../mail/templates/courseEnrollmentEmail");
const { paymentSuccessEmail } = require("../mail/templates/paymentSuccessEmail");
const crypto = require("crypto");
const CourseProgress = require("../models/CourseProgress");

// Initiate Razorpay order
exports.capturePayment = async (req, res) => {
  try {
    const { courses } = req.body;
    const userId = req.user.id;

    if (!Array.isArray(courses) || courses.length === 0) {
      return res.status(400).json({ success: false, message: "Please provide course IDs" });
    }

    let totalAmount = 0;

    for (const courseId of courses) {
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ success: false, message: "Course not found" });
      }

      // do not allow buying an already-enrolled course
      if (course.studentsEnrolled?.includes(userId)) {
        return res.status(400).json({ success: false, message: "Student is already Enrolled" });
      }

      totalAmount += Number(course.price || 0);
    }

    const options = {
      amount: Math.round(totalAmount * 100),
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
    };

    const order = await instance.orders.create(options);
    return res.status(200).json({ success: true, message: order });
  } catch (error) {
    console.error("capturePayment error:", error);
    return res.status(500).json({ success: false, message: "Could not initiate order" });
  }
};

// Verify the payment
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, courses } = req.body;
    const userId = req.user.id;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !Array.isArray(courses)) {
      return res.status(400).json({ success: false, message: "Payment Failed" });
    }

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Invalid payment signature" });
    }

    // enroll user in all courses
    for (const courseId of courses) {
      const enrolledCourse = await Course.findByIdAndUpdate(
        courseId,
        { $addToSet: { studentsEnrolled: userId } },
        { new: true }
      );

      if (!enrolledCourse) {
        return res.status(404).json({ success: false, message: "Course not Found" });
      }

      const courseProgress = await CourseProgress.create({
        courseID: courseId,
        userId: userId,
        completedVideos: [],
      });

      await User.findByIdAndUpdate(
        userId,
        { $addToSet: { courses: courseId, courseProgress: courseProgress._id } },
        { new: true }
      );

      // send enrollment email
      try {
        await mailSender(
          (await User.findById(userId)).email,
          `Successfully Enrolled into ${enrolledCourse.courseName}`,
          courseEnrollmentEmail(enrolledCourse.courseName, (await User.findById(userId)).firstName)
        );
      } catch (e) {
        console.warn("Enrollment email failed:", e.message);
      }
    }

    return res.status(200).json({ success: true, message: "Payment Verified" });
  } catch (error) {
    console.error("verifyPayment error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Send payment success email (separate)
exports.sendPaymentSuccessEmail = async (req, res) => {
  try {
    const { orderId, paymentId, amount } = req.body;
    const userId = req.user.id;

    if (!orderId || !paymentId || !amount || !userId) {
      return res.status(400).json({ success: false, message: "Please provide all the fields" });
    }

    const user = await User.findById(userId);
    await mailSender(
      user.email,
      `Payment Received`,
      paymentSuccessEmail(`${user.firstName}`, amount / 100, orderId, paymentId)
    );

    return res.status(200).json({ success: true, message: "Email sent" });
  } catch (error) {
    console.error("sendPaymentSuccessEmail error:", error);
    return res.status(500).json({ success: false, message: "Could not send email" });
  }
};
