const jwt = require("jsonwebtoken");
require("dotenv").config();
const User = require("../models/User");

exports.auth = (req, res, next) => {
    try {
        //extract token
        //other way to fetch token

        //note :- always try send token in the cookies, not in the body bcz sending token in the body is less secure
        //try to use (req.header("Authorization").replace("Bearer ","")) :- as it is more reliable

        const token = req.body.token || req.cookies.token || req.header("Authorization").replace("Bearer ", "");

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Token missing",
            });
        }

        //verify the token  methond - verify by jwt
        try {
            const decode = jwt.verify(token, process.env.JWT_SECRET);
            console.log(decode);

            req.user = decode;
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: "Token is invalid",
            });
        }
        next();

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Something went wrong whle verifying the token",
        });
    }
}


exports.isStudent = (req, res, next) => {
    try {
        if (req.user.accountType !== "Student") {
            return res.status(401).json({
                success: false,
                message: "This is a protected route for students",
            });
        }
        next();
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "User role is not matching",
        });
    }
}

exports.isInstructor = (req, res, next) => {
    try {
        if (req.user.accountType !== "Instructor") {
            return res.status(401).json({
                success: false,
                message: "This is a protected route for Instructor",
            });
        }
        next();
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "User role is not matching",
        });
    }
}

exports.isAdmin = (req, res, next) => {
    try {
        if (req.user.role !== "Admin") {
            return res.status(401).json({
                success: false,
                message: "This is a protected route for admin",
            });
        }
        next();
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "User role is not matching",
        });
    }
}