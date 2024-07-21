const SubSection = require("../models/SubSection");
const Section = require("../models/Section");
const { uploadImageToCloudinary } = require("../utils/imageUploader");
require("dotenv").config();

//create subsection
exports.createSubSection = async (req, res) => {
    try {
        // Fetch data from req body
        const { sectionId, title, timeDuration, description } = req.body;

        // Extract video file
        const video = req.files.videoFile;

        // Validation
        if (!sectionId || !title || !timeDuration || !description || !video) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        // Upload video to Cloudinary
        const uploadDetails = await uploadImageToCloudinary(
            video,
            process.env.FOLDER_NAME
        );

        // Create a sub section
        const subSectionDetails = await SubSection.create({
            title: title,
            timeDuration: timeDuration,
            description: description,
            videoUrl: uploadDetails.secure_url,
        });

        // Update the section with this sub section ObjectId
        const updatedSection = await Section.findByIdAndUpdate(
            sectionId,
            {
                $push: {
                    subSection: subSectionDetails._id,
                },
            },
            { new: true }
        ).populate("subSection");

        // Return response
        return res.status(200).json({
            success: true,
            message: "SubSection created successfully",
            updatedSection,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Unable to create sub section, please try again",
            error: error.message,
        });
    }
};

// Update SubSection
exports.updateSubSection = async (req, res) => {
    try {
        const { subSectionId, title, timeDuration, description } = req.body;

        if (!subSectionId) {
            return res.status(400).json({
                success: false,
                message: "SubSection ID is required for updating.",
            });
        }

        const updatedSubSection = await SubSection.findByIdAndUpdate(
            subSectionId,
            {
                title: title,
                timeDuration: timeDuration,
                description: description,
            },
            { new: true }
        );

        return res.status(200).json({
            success: true,
            message: "SubSection updated successfully",
            updatedSubSection,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Unable to update SubSection, please try again",
            error: error.message,
        });
    }
};

// Delete SubSection
exports.deleteSubSection = async (req, res) => {
    try {
        const { subSectionId } = req.body;

        if (!subSectionId) {
            return res.status(400).json({
                success: false,
                message: "SubSection ID is required for deletion.",
            });
        }

        const deletedSubSection = await SubSection.findByIdAndDelete(subSectionId);

        if (!deletedSubSection) {
            return res.status(404).json({
                success: false,
                message: "SubSection not found for deletion.",
            });
        }

        return res.status(200).json({
            success: true,
            message: "SubSection deleted successfully",
            deletedSubSection,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Unable to delete SubSection, please try again",
            error: error.message,
        });
    }
};

// Verify signature of Razorpay and Server
exports.verifySignature = async (req, res) => {
    // Server secret
    const webhookSecret = "12345678";

    // Razorpay signature
    const signature = req.header("x-razorpay-signature");

    // Match both secrets or implement the verification logic based on the signature

    // Add verification logic here
};