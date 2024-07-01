const { instance } = require("../config/razorpay");
const Course = require("../models/Course");
const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const { courseEnrollmentEmail } = require("../mail/templates/courseEnrollmentEmail");
const { default: mongoose } = require("mongoose");






// 1. create the payment 
// 2. verify the payment
// 3. fullfill the action

//capture payment and initiate the razorpay order
exports.capturePayment = async (req, res) => {
    try {
        const { course_id } = req.body;
        const userId = req.user.id;
        //validation of courseId
        if (!course_id) {
            return res.status(400).json({
                success: false,
                message: "Please provide valid Course Id.",
            });
        }
        //validation of course details
        let course;
        try {
            course = await Course.findById(course_id);
            if (!course) {
                return res.status(400).json({
                    success: false,
                    message: "Could not find the course.",
                });
            }

            //this is used to convert string into object id[ in schema it is stored in the form of string]
            const uid = new mongoose.Types.ObjectId(userId);
            if (course.studentsEnrolled.includes(uid)) {
                return res.status(400).json({
                    success: false,
                    message: "You have already enrolled in this course."
                });
            }
        }
        catch (error) {
            console.log(error);
            return res.status(500).json({
                success: false,
                message: error.message,
            });
        }
        //create order
        const amount = course.price;
        const currency = "INR";

        const options = {
            amount: amount * 100,
            currency: currency,
            receipt: Math.random(Date.now()).toString,
            notes: {
                courseId: course_id,
                userId,
            }
        };
        try {
            //initiate the payment using razorpay
            const paymentResponse = await instance.orders.create(options);
            console.log(paymentResponse);
            //send response to the client
            return res.status(200).json({
                success: true,
                courseName: course.courseName,
                courseDescription: course.courseDescription,
                thumbnail: course.thumbnail,
                orderId: paymentResponse.id,
                currency: paymentResponse.currency,
                amount: paymentResponse.amount,
            });
        }
        catch (error) {
            console.log(error);
            return res.status(500).json({
                success: false,
                mesage: "Could not Initiate Order"
            });
        }
    }
    catch (error) {
        console.log(error);
    }
}

//verfify payment
exports.verifyPayment = async (req, res) => {
    try {
        //here we will match the secret that is send by the razorpay and the backend of the server itself
        const webhookSignature = "12345678";
        const signature = ["x-razorpay-signature"];

        //hmac- hash based message authentication code
        const shasum = crypto.create("sha256", webhookSignature);
        shasum.update(JSON.stringify(req.body));    // used to conert it into string
        const digest = shasum.digest("hex");

        if (signature === shasum) {
            console.log("Payment is authorized");
        }
        const { courseId, userId } = req.body.payload.payment.entity.notes;
        try {

            const enrolledCourse = await Course.findOneAndUpdate(
                { _id: courseId },
                { $push: { studentsEnrolled: userId } },
                { new: true },
            )

            if (!enrolledCourse) {
                return res.status(500).json({
                    success: false,
                    message: "Course not found",
                });
            }
            console.log(enrolledCourse);

            const enrolledstudent = await User.findOneAndUpdate(
                { _id: userId },
                { $push: { courses: courseId } },
                { new: true },
            )

            if (!enrolledstudent) {
                return res.status(500).json({
                    success: false,
                    message: "Course not found",
                });
            }
            console.log(enrolledstudent);

            //now sending mail
            const emailResponse = await mailSender(
                enrolledstudent.email,
                "congratulation from dadaboudi",
                "Congratulation , please continue learning",
            )
            console.log(emailResponse);
            return res.status(200).json({
                success: true,
                message: "Signature verified and course added",
            });
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    }
    
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}