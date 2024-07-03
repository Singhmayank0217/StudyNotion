const User = require("../models/User");
const mailSender = require("../utils/mailSender")
const bcrypt = require("bcrypt")

//resetPasswordToken

exports.resetPasswordToken = async (req, res) => {
    try {

        const email = req.body.email;
        const user = await User.findOne({ email: email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
        const token = crypto.randomUUID();
        const updatedDetails = await User.findOneAndUpdate({ email: email }, {
            token: token,
            resetPasswordExpires: Date.now() + 5 * 60 * 1000,
        },
            { new: true }); //this line return the updated response if not then it will return the previos response
        const url = `http://localhost:3000/update-password/${token}`

        await mailSender(email, "Password reset link", `password reset link : ${url}`);
        return res.status(200).json({
            success: true,
            message: "Email sent successfully, please check email and change the password",
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while reseting the password. Please try again later.",
        });
    }
}

exports.resetPassword = async (req, res) => {
    try {

        const { password, confirmPassword, token } = req.body;

        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Password and confirm password do not match",
            });
        }
        const userDetails = await User.findOne({ token: token });
        if (!userDetails) {
            return res.status(404).json({
                success: false,
                message: "Invalid token",
            });
        }
        if (userDetails.resetPasswordExpires < Date.now()) {
            return res.status(400).json({
                success: false,
                message: "Token time expired, please try again",
            });
        }
        const hashedPassword = await bcrypt.hash(password, 10);

        await User.findOneAndUpdate({ token: token },
            { password: hashedPassword },
            { new: true },
        );
        return res.status(200).json({
            success: true,
            message: "Password reset successfully",
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while reseting the password. Please try again later.",
        });
    }
}