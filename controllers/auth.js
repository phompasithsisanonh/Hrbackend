const authModel = require("../models/auth");
const bcrypt = require("bcryptjs");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const cloudinary = require("../utils/cloudinary"); // Ensure this path is correct
const fs = require("fs").promises;
const Notice = require("../models/PostNotice"); // Ensure this path is correct
// ฟังก์ชันช่วยอัปโหลดไฟล์ไป Cloudinary
const uploadToCloudinary = async (file) => {
  try {
    // ตรวจสอบว่าไฟล์มีอยู่
    await fs.access(file.path);
    const result = await cloudinary.uploader.upload(file.path, {
      folder: "profile_images", // โฟลเดอร์ที่ต้องการเก็บไฟล์ใน Cloudinary
      resource_type: "image", // ประเภทของไฟล์ที่อัปโหลด
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
const authRegister = async (req, res) => {
  try {
    // Destructure request body
    const { name, tel, email, password, role } = req.body;
    // Validate input fields
    if (!name || !tel || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Validate email format
    if (!validator.isEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    // Validate phone number (basic validation, adjust as needed)
    if (!validator.isMobilePhone(tel)) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number",
      });
    }

    // Validate password strength (minimum 8 characters)
    if (!validator.isLength(password, { min: 8 })) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long",
      });
    }

    // Check if user already exists
    const existingUser = await authModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = new authModel({
      name,
      tel,
      email,
      password: hashedPassword,
      role,
    });

    // Save user to database
    await newUser.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser._id, email: newUser.email },
      process.env.TOKEN_SECRET, // Use environment variable in production
      { expiresIn: "7d" } // Token expires in 7 days
    );
    // Set cookie with JWT
    res.cookie("authToken", token, {
      httpOnly: true, // Prevents client-side JavaScript access
      secure: true, // Use secure cookies in production
      sameSite: "strict", // Helps prevent CSRF attacks
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    });

    // Return success response
    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        name: newUser.name,
        email: newUser.email,
        tel: newUser.tel,
      },
      token: token,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const login = async (req, res) => {
  try {
    const { tel, password } = req.body;

    // ตรวจสอบค่าที่ได้รับจาก req.body
    if (!tel || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }
    const findSeller = await authModel.findOne({ tel }).select("+password");
    if (!findSeller) {
      return res.status(404).json({
        success: false,
        message: "tel or password incorrect",
      });
    }
    if (!findSeller.password) {
      return res.status(500).json({
        success: false,
        message: "Stored password is missing",
      });
    }

    const match = await bcrypt.compare(password, findSeller.password);

    if (!match) {
      return res.status(401).json({
        success: false,
        message: "Invalid Password",
      });
    }

    const token = jwt.sign(
      { _id: findSeller._id, role: findSeller.role },
      process.env.TOKEN_SECRET,
      { expiresIn: "1d" }
    );

    res.cookie("authToken", token, {
      httpOnly: true,
      secure: true, // true for HTTPS
      sameSite: "None",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: "Login successfully",
      token,
    });
  } catch (error) {
    console.error("Error in seller_login:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getAuth = async (req, res) => {
  try {
    const { id } = req;
    const auth = await authModel.findById(id);
    if (!auth) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    res.status(200).json({
      success: true,
      data: auth,
    });
  } catch (error) {
    console.error("Error in getAuth:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
}; // Middleware to handle file upload before the main handler
const deleteFromCloudinary = async (publicId) => {
  await cloudinary.uploader.destroy(publicId);
};
const editProfile = async (req, res) => {
  // Run multer middleware

  try {
    const { id } = req.params;
    const { name, tel, typeBusiness, address } = req.body;
    // Validate input fields
    if (!name || !tel || !typeBusiness || !address) {
      return res.status(400).json({
        success: false,
        message: "All fields (name, tel, typeBusiness, address) are required",
      });
    }

    // Validate phone number
    if (!validator.isMobilePhone(tel, "any", { strictMode: false })) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number",
      });
    }
    const checkImage = await authModel.findById(id);
    const getPublicIdFromUrl = (url) => {
      const urlParts = url.split("/upload/")[1]; // เอาส่วนหลังจาก /upload/
      const withoutVersion = urlParts.split("/").slice(1).join("/"); // ตัด vxxxxxxx ออก
      const withoutExt = withoutVersion.split(".")[0]; // ตัด .jpg ออก
      return withoutExt;
    };
    const cover = getPublicIdFromUrl(checkImage.image);
    // Check if the user exists
    if (checkImage.image && cover) {
      await deleteFromCloudinary(cover);
    }
    // Find user by ID
    const user = await authModel.findByIdAndUpdate(
      id,
      {
        name,
        tel,
        typeBusiness,
        address,
        image: req.file ? await uploadToCloudinary(req.file) : undefined,
      },
      {
        new: true, // Return the updated document
        runValidators: true, // Validate the update against the schema
      }
    );
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    // Return success response with updated user data
    return res.status(200).json({
      success: true,
      message: "User profile updated successfully",
    });
  } catch (error) {
    console.error("Error in editProfile:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Export the controller
const uploadToCloudinaryPostNotice = async (file) => {
  try {
    // ตรวจสอบว่าไฟล์มีอยู่
    await fs.access(file.path);
    const result = await cloudinary.uploader.upload(file.path, {
      folder: "Post", // โฟลเดอร์ที่ต้องการเก็บไฟล์ใน Cloudinary
      resource_type: "image", // ประเภทของไฟล์ที่อัปโหลด
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
const postNotice = async (req, res) => {
  try {
    const { id } = req;
    const { title, content, author, priority } = req.body;
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: "Title and content are required",
      });
    }
    // Logic to save notice to the database would go here
    const notice = new Notice({
      HrAdminId: id,
      title,
      content,
      author,
      priority,
    });
    // If you have an image, upload it to Cloudinary

    if (req.file) {
      const imageUrl = await uploadToCloudinaryPostNotice(req.file);
      notice.postImage = imageUrl;
      await notice.save();
    }
    // Return success response
    res.status(201).json({
      success: true,
      message: "Notice posted successfully",
    });
  } catch (error) {
    console.error("Error in PostNotice:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
const getPost = async (req, res) => {
  try {
    const notices = await Notice.find({
      HrAdminId: req.id,
    }).sort({ date: -1 }); // Sort by date in descending order
    if (!notices || notices.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No notices found",
      });
    }
    res.status(200).json({
      success: true,
      data: notices,
    });
  } catch (error) {
    console.error("Error in getPost:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

///edit-post

const editPost = async (req, res) => {
  // Run multer middleware

  try {
    const { id } = req.params;
    const { title, content, author, priority } = req.body;
    // Validate input fields
    if (!title || !content || !author || !priority || !req.file) {
      return res.status(400).json({
        success: false,
        message: "ກະລຸນາເພີ່ມໄຟລ໌ຮູບພາບຫຼືຂໍ້ມູນໃຫ້ຄົບຖ້ວນ",
      });
    }
    const checkImage = await Notice.findById(id);
    const getPublicIdFromUrl = (url) => {
      const urlParts = url.split("/upload/")[1]; // เอาส่วนหลังจาก /upload/
      const withoutVersion = urlParts.split("/").slice(1).join("/"); // ตัด vxxxxxxx ออก
      const withoutExt = withoutVersion.split(".")[0]; // ตัด .jpg ออก
      return withoutExt;
    };
    const cover = getPublicIdFromUrl(checkImage.postImage);
    // Check if the user exists
    if (checkImage.postImage && cover) {
      await deleteFromCloudinary(cover);
    }
    // Find user by ID
    const user = await Notice.findByIdAndUpdate(
      id,
      {
        title,
        content,
        author,
        priority,
        postImage: req.file
          ? await uploadToCloudinaryPostNotice(req.file)
          : undefined,
      },
      {
        new: true, // Return the updated document
        runValidators: true, // Validate the update against the schema
      }
    );
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    // Return success response with updated user data
    return res.status(200).json({
      success: true,
      message: "User profile updated successfully",
    });
  } catch (error) {
    console.error("Error in editProfile:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Notice.findByIdAndDelete(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }
    // If the post has an image, delete it from Cloudinary
    if (post.postImage) {
      const getPublicIdFromUrl = (url) => {
        const urlParts = url.split("/upload/")[1]; // เอาส่วนหลังจาก /upload/
        const withoutVersion = urlParts.split("/").slice(1).join("/"); // ตัด vxxxxxxx ออก
        const withoutExt = withoutVersion.split(".")[0]; // ตัด .jpg ออก
        return withoutExt;
      };
      const cover = getPublicIdFromUrl(post.postImage);
      await deleteFromCloudinary(cover);
    }
    res.status(200).json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.error("Error in deletePost:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
module.exports.authRegister = authRegister;
module.exports.login = login;
module.exports.getAuth = getAuth;
module.exports.editProfile = editProfile;
module.exports.postNotice = postNotice;
module.exports.getPost = getPost;
module.exports.editPost = editPost;
module.exports.deletePost = deletePost;
