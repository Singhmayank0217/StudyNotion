const SubSection = require("../models/SubSection");
const Section = require("../models/Section");
const { uploadImageToCloudinary } = require("../utils/imageUploader");
require("dotenv").config();

exports.createSubSection = async (req, res) => {
    try {

        const { sectionId, title, timeDuration, description } = req.body;
        const video = req.file.videoFile;

        if (!sectionId || !title || !timeDuration || !description || !video) {
            return res.status(400).json({
                success: false,
                message: "Please fill all the fields",
            });
        }

        const uploadDetails = await uploadImageToCloudiary(video, process.env.FOLDER_NAME);
        const subSectionDetails = await SubSection.create({
            title: title,
            timeDuration: timeDuration,
            description: description,
            videoUrl: uploadDetails.secure_url,
        })

        const updatedSection = await Section.findByIdAndUpdate({ _id: sectionId },
            {
                $push: {
                    SubSection: subSectionDetails._id,
                }
            },
            { new: true }
        ).populate('subSections');
        // Logging the updated section with populated sub-sections
        console.log("Updated Section:", updatedSection);

        res.status(200).json({
            success: true,
            message: "Sub-section created and added to section successfully",
            data: updatedSection,
        });
    } catch (error) {
        console.error("Error creating sub-section:", error);
        res.status(500).json({
            success: false,
            message: "Unable to create sub-section, please try again",
            error: error.message,
        });
    }
};

//update subsection 
exports.updateSubSection = async (req, res) => {
    try {
        const { subSectionId, title, timeDuration, description } = req.body;

        if (!subSectionId || !title || !timeDuration || !description) {
            return res.status(400).json({
                success: false,
                message: "Please provide subSectionId, title, timeDuration, and description",
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

        if (!updatedSubSection) {
            return res.status(404).json({
                success: false,
                message: "Sub-section not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Sub-section updated successfully",
            data: updatedSubSection,
        });

    } catch (error) {
        console.error("Error updating sub-section:", error);
        res.status(500).json({
            success: false,
            message: "Unable to update sub-section, please try again",
            error: error.message,
        });
    }
};

//delete subsection

exports.deleteSubSection = async (req, res) => {
    try {
        const { subSectionId, sectionId } = req.body;
        
        if (!subSectionId || !sectionId) {
            return res.status(400).json({
                success: false,
                message: "Please provide subSectionId and sectionId",
            });
        }

        const deletedSubSection = await SubSection.findByIdAndDelete(subSectionId);

        if (!deletedSubSection) {
            return res.status(404).json({
                success: false,
                message: "Sub-section not found",
            });
        }

        // Removing the sub-section reference from the section
        await Section.findByIdAndUpdate(
            sectionId,
            {
                $pull: {
                    subSections: subSectionId,
                }
            },
            { new: true }
        );

        res.status(200).json({
            success: true,
            message: "Sub-section deleted successfully",
        });

    } catch (error) {
        console.error("Error deleting sub-section:", error);
        res.status(500).json({
            success: false,
            message: "Unable to delete sub-section, please try again",
            error: error.message,
        });
    }
};