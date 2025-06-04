const Benefit = require("../../models/benefits");
const cloudinary = require("../../utils/cloudinary");
const fs = require("fs").promises;
const emplee = require("../../models/emplyeeModel");
const uploadToCloudinary = async (file) => {
  try {
    // ตรวจสอบว่าไฟล์มีอยู่
    await fs.access(file.path);
    const result = await cloudinary.uploader.upload(file.path, {
      folder: "benefits",
      resource_type: "raw", // อัปโหลดไฟล์ประเภทต่างๆ เช่น รูปภาพ, PDF
    });
    // ลบไฟล์ชั่วคราวหลังอัปโหลดสำเร็จ
    await fs
      .unlink(file.path)
      .catch((err) =>
        console.warn("Warning: Could not delete temp file:", err)
      );
    return result.secure_url;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    // ลบไฟล์ถ้ามี error เพื่อป้องกันการค้าง
    await fs.unlink(file.path).catch(() => {});
    throw new Error(`Failed to upload file: ${error.message}`);
  }
};

const addBenefit = async (req, res) => {
  try {
    const { name, description, type, amount, eligibility, isActive } = req.body;
    const { id } = req;
    const attachedDocument = req.files ? req.files : req.file; // Assuming you're using multer for file uploads
    const uploadToCloudinaryBenifit = await uploadToCloudinary(
      attachedDocument
    );

    // Create a new benefit instance
    const newBenefit = new Benefit({
      HrAdminId: id,
      name: name,
      description: description,
      type: type,
      amount: amount,
      eligibility: eligibility,
      isActive,
      attachedDocument: uploadToCloudinaryBenifit || null,
    });

    await newBenefit.save();

    res.status(201).json({
      success: true,
      message: "Benefit added successfully",
    });
  } catch (error) {
    console.error("Error adding benefit:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add benefit",
      error: error.message,
    });
  }
};

// const getSignedUrl = (publicId) => {
//   console.log(publicId);
//   return cloudinary.utils.private_download_url(publicId, "pdf", {
//     type: "authenticated",
//     resource_type: "raw",
//     sign_url: true,
//     expires_at: Math.floor(Date.now() / 1000) + 3600, // หมดอายุใน 1 ชั่วโมง
//   });
// };
const getAllBenefits = async (req, res) => {
  try {
    const { id } = req;
    const benefits = await Benefit.find({ HrAdminId: id }).exec();

    // const data = {
    //   benefits: benefits.map((benefit) => ({
    //     ...benefit.toObject(),
    //     pdfUrl: getSignedUrl(getPublicIdFromUrl(benefit.attachedDocument)),
    //   })),
    // };
    res.status(200).json({
      success: true,
      data: benefits,
    });
  } catch (error) {
    console.error("Error fetching benefits:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch benefits",
      error: error.message,
    });
  }
};
// ฟังก์ชัน generate signed URL

// ตัวอย่างการเรียกใช้งาน

const getBenifitsId = async (req, res) => {
  try {
    const { id } = req.params;
    const benefit = await Benefit.findById(id).exec();

    if (!benefit) {
      return res.status(404).json({
        success: false,
        message: "Benefit not found",
      });
    }
    // ส่งข้อมูล benefit พร้อม signed URL กลับไป
    res.status(200).json({
      success: true,
      data: benefit,
    });
  } catch (error) {
    console.error("Error fetching benefit by ID:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch benefit",
      error: error.message,
    });
  }
};
const deleteFromCloudinary = async (publicId) => {
  await cloudinary.uploader.destroy(publicId);
};
const editBenefit = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Benefit ID is required",
      });
    }
    if (!req.file && !req.files) {
      return res.status(400).json({
        success: false,
        message: "File is required for updating benefit",
      });
    }
    // ตรวจสอบว่ามีไฟล์แนบหรือไม่
    if (
      !req.body ||
      !req.body.name ||
      !req.body.description ||
      !req.body.type ||
      !req.body.amount ||
      !req.body.eligibility
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }
    const { name, description, type, amount, eligibility, isActive } = req.body;
    const checkImage = await Benefit.findById(id).exec();
    const getPublicIdFromUrl = (url) => {
      const urlParts = url.split("/upload/")[1]; // เอาส่วนหลังจาก /upload/
      const withoutVersion = urlParts.split("/").slice(1).join("/"); // ตัด vxxxxxxx ออก
      const withoutExt = withoutVersion.split(".")[0]; // ตัด .jpg ออก
      return withoutExt;
    };
    const cover = getPublicIdFromUrl(checkImage?.attachedDocument);
    if (cover && checkImage.attachedDocument) {
      console.log("Deleting cover from Cloudinary:", cover);
      await deleteFromCloudinary(cover);
    }
    const attachedDocument = req.files ? req.files : req.file; // Assuming you're using multer for file uploads
    const updateData = {
      name,
      description,
      type,
      amount,
      eligibility,
      isActive,
      attachedDocument: await uploadToCloudinary(attachedDocument),
    };
    const updatedBenefit = await Benefit.findByIdAndUpdate(id, updateData, {
      new: true,
    });
    if (!updatedBenefit) {
      return res.status(404).json({
        success: false,
        message: "Benefit not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "Benefit updated successfully",
    });
  } catch (error) {
    console.error("Error updating benefit:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update benefit",
      error: error.message,
    });
  }
};
const deleteBenefit = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Benefit ID is required",
      });
    }
    const benefit = await Benefit.findByIdAndDelete(id);
    if (!benefit) {
      return res.status(404).json({
        success: false,
        message: "Benefit not found",
      });
    }
    // ลบไฟล์จาก Cloudinary
    const getPublicIdFromUrl = (url) => {
      const urlParts = url.split("/upload/")[1]; // เอาส่วนหลังจาก /upload/
      const withoutVersion = urlParts.split("/").slice(1).join("/"); // ตัด vxxxxxxx ออก
      const withoutExt = withoutVersion.split(".")[0]; // ตัด .jpg ออก
      return withoutExt;
    };
    const cover = getPublicIdFromUrl(benefit.attachedDocument);
    if (cover && benefit.attachedDocument) {
      console.log("Deleting cover from Cloudinary:", cover);
      await deleteFromCloudinary(cover);
    }
    res.status(200).json({
      success: true,
      message: "Benefit deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting benefit:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete benefit",
      error: error.message,
    });
  }
};
const addBennifitEmplyee = async (req, res) => {
  try {
    const { code, item } = req.body;

    // ตรวจสอบพนักงานว่ามีจริงไหม
    const checkEmplyee = await emplee.findById(code);

    if (!checkEmplyee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }
    const itemId = item.map((i) => i._id);
    // อัปเดตข้อมูล
    const updatedEmployee = await emplee.findByIdAndUpdate(
      code,
      {
        $push: {
          bennifits: {
            $each: itemId,
          },
        },
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Benefit added successfully",
      data: updatedEmployee,
    });
  } catch (error) {
    console.error("Error adding benefit:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add benefit",
      error: error.message,
    });
  }
};

module.exports = {
  addBenefit,
  getAllBenefits,
  getBenifitsId,
  editBenefit,
  deleteBenefit,
  addBennifitEmplyee,
  // Other functions can be added here as needed
};
