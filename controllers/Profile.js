const cron = require('node-cron');
const User = require("../models/User");
const Profile = require("../models/Profile");
const Course = require("../models/Course");

//update account
exports.updateProfile = async (req, res) => {
    try {

        const { dateOfBirth = "", about = "", contactNumber, gender } = req.body;
        const id = req.user.id;
        if (!gender || !contactNumber || !id) {
            return res.status(400).json({
                success: false,
                message: "Please fill all the fields"
            });
        }
        const userDetails = await User.findById(id);
        const profileDetails = userDetails.additionalDetails;
        const profileId = await Profile.findById(profileDetails);

        //updating the details[here we are directly updating the details as the object is already created] 
        profileDetails.dateOfBirth = dateOfBirth;
        profileDetails.about = about;
        profileDetails.contactNumber = contactNumber;
        profileDetails.gender = gender;
        await profileDetails.save();
        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            profileDetails,
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
}


//delete account
exports.deleteAccount = async (req, res) => {
    try {
        const id = req.user.id
        const user = await User.findById({ _id: id })
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found", })
        }

        // Delete Assosiated Profile with the User , note we used here "new mongoose.Types.ObjectId()" to convert string into object;
        await Profile.findByIdAndDelete({ _id: new mongoose.Types.ObjectId(user.additionalDetails), })

        for (const courseId of user.courses) {
            await Course.findByIdAndUpdate(courseId, { $pull: { studentsEnrolled: id } }, { new: true })
        }

        // Now Delete User
        await User.findByIdAndDelete({ _id: id })

        res.status(200).json({
            success: true,
            message: "User deleted successfully",
        })

        await CourseProgress.deleteMany({ userId: id })
    }
    catch (error) {
        res.status(500).json({ success: false, message: "User Cannot be deleted successfully" })
    }
}


exports.getAllUserDetails = async (req, res) => {
    try {
        const id = req.user.id
        const userDetails = await User.findById(id).populate("additionalDetails").exec()

        res.status(200).json({
            success: true,
            message: "User Data fetched successfully",
            data: userDetails,
        })
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}

