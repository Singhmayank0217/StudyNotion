const User = require("../models/User");
const OTP = require("../models/OTP");
const otpGenerator = require("otp-generator");
const Profile = require("../models/Profile");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const nodemailer = require("nodemailer");
const mailSender = require("../utils/mailSender");

//Otp 
exports.sendOTP = async (req, res) => {

    try {
        const { email } = req.body;
        const checkUserPresent = await User.findOne({ email });

        if (checkUserPresent) {
            return res.status(401).json({
                success: false,
                message: "User already exists",
            })
        }
        var otp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false,
        });
        console.log("generated otp", otp);

        //checking for unique otp
        let result = await OTP.findOne({ otp: otp });
        while (result) {
            otp = otpGenerator.generate(6, {
                upperCaseAlphabets: false,
                lowerCaseAlphabets: false,
                specialChars: false,
            });
            result = await OTP.findOne({ otp: otp });
        }

        // when the unique otp is generated then we have to do the entry in the database
        const otpPayLoad = { email, otp };

        //creating an entry for otp
        const otpbody = await OTP.create(otpPayLoad);
        console.log(otpbody);

        res.status(200).json({
            success: true,
            message: "OTP sent successfully",
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}
//SignUp
exports.signUp = async (req, res) => {

    try {
        const {
            firstName,
            lastName,
            email,
            password,
            confirmPassword,
            accountType,
            contactNumber,
            otp
        } = req.body;

        if (!firstName || !lastName || !email || !password || !confirmPassword || !otp) {
            return res.status(403).json({
                success: false,
                message: "Please fill all the fields",
            });
        }

        if (password !== confirmPassword) {
            return res.status(403).json({
                success: false,
                message: "Password and confirm password do not match",
            });
        }
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(403).json({
                success: false,
                message: "User already exists",
            });
        }
        //finding the most recent otp 
        const recentOTp = await OTP.find({ otp }).sort({ createdAt: -1 }).limit(1);
        console.log(recentOTp);

        //validate otp
        if (recentOTp.length == 0) {
            return res.status(403).json({
                success: false,
                message: "Otp not found"
            });
        } else if (otp !== recentOTp) {
            return res.status(403).json({
                success: false,
                message: "Invalid Otp"
            });
        }

        const hashedpassword = await bcrypt.hash(password, 10);

        const profileDetails = await Profile.create({
            gender: null,
            dateOfBirth: null,
            about: null,
            contactNumber: null,
        });

        const user = await User.create({
            firstName,
            lastName,
            email,
            contactNumber,
            password: hashedpassword,
            accountType,
            additionalDetails: profileDetails._id,
            image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`,
        });
        return res.status(200).json({
            success: true,
            message: "User is registered successfully",
            user,
        })
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "User cannot be registered",
        });
    }
}
//Login

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(403).json({
                success: false,
                message: "All field are required please fill the data",
            });
        }
        const user = await User.findOne({ email }).populate("additionalDetails");
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found, please signup first",
            });
        }
        if (await bcrypt.compare(password, user.password)) {
            const payload = {
                email: user.email,
                id: user._id,
                accountType: user.accountType,
            }
            const token = jwt.sign(payload, process.env.JWT_SECRET, {
                expiresIn: "2h",
            });
            user.token = token;
            user.password = undefined;

            const options = {
                expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                httpOnly: true,
            }
            res.cookie("token", token, options).status(200).json({
                success: true,
                token,
                user,
                message: "Logged in successfully",
            })
        }
        else {
            return res.status(401).json({
                success: false,
                message: "Password is incorrect",
            })
        }
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Login failure, try again",
        });
    }
}

//change password
/* exports.changePassword = async (req, res) => {

     try {
         get data from request body
         get oldPassword, newPassword, confirmPassword
         validation
         update in db
         send mail
         return response
    }
     catch (error) {

     }
 }*/
exports.changePassword = async (req, res) => {
    try {
        // Get data from request body
        const { email, oldPassword, newPassword, confirmPassword } = req.body;

        // Validation
        if (!email || !oldPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "New password and confirm password do not match",
            });
        }

        // Find the user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Check if old password is correct
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Old password is incorrect",
            });
        }

        // Hash the new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        // Update the password in the database
        const updatedUserDetails = await User.findByIdAndUpdate(
            req.user.id,
            { password: hashedNewPassword },
            { new: true }
        )
        // Send confirmation email
        try {
            const emailResponse = await mailSender(
                updatedUserDetails.email,
                "Password for your account has been updated",
                passwordUpdated(
                    updatedUserDetails.email,
                    `Password updated successfully for ${updatedUserDetails.firstName} ${updatedUserDetails.lastName}`
                )
            )
            console.log("Email sent successfully:", emailResponse.response)
        } catch (error) {
            // If there's an error sending the email, log the error and return a 500 (Internal Server Error) error
            console.error("Error occurred while sending email:", error)
            return res.status(500).json({
                success: false,
                message: "Error occurred while sending email",
                error: error.message,
            })
        }
        // Return success response
        return res
            .status(200)
            .json({
                success: true,
                message: "Password updated successfully",
            })
    } catch (error) {
        // If there's an error updating the password, log the error and return a 500 (Internal Server Error) error
        console.error("Error occurred while updating password:", error)
        return res.status(500).json({
            success: false,
            message: "Error occurred while updating password",
            error: error.message,
        })
    }
}