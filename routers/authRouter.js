const express = require("express");
const {
  authRegister,
  login,
  editProfile,
  postNotice,
  getPost,
  editPost,
  deletePost,
} = require("../controllers/auth");
const { authMiddlewares } = require("../middleware/authmiddleware");
const authrouter = express.Router();
const authModel = require("../models/auth");
const emplyeeModel = require("../models/emplyeeModel");
const { upload } = require("../middleware/upload");
const jwt = require("jsonwebtoken");
authrouter.post("/auth", authRegister);
authrouter.post("/login", login);
authrouter.patch(
  "/edit/:id",
  upload.single("image"),
  authMiddlewares,
  editProfile
);
authrouter.post(
  "/postNotice",
  upload.single("postImage"),
  authMiddlewares,
  postNotice
);
authrouter.get("/get-notice", authMiddlewares, getPost);
//editPost
authrouter.patch(
  "/edit-postNotice/:id",
  upload.single("postImage"),
  authMiddlewares,
  editPost
);
authrouter.delete("/delete-postNotice/:id", authMiddlewares, deletePost);

authrouter.get("/get-user", authMiddlewares, async (req, res) => {
  try {
    const { id, role } = req;
    if (role === "CHR") {
      const user = await authModel.findById(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.status(200).json({ userInfo: user });
    } else {
      return res.status(403).json({ message: "Access denied" });
    }
  } catch (error) {
    console.error("Error in /get-user:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});
authrouter.get("/get-all-user", authMiddlewares, async (req, res) => {
  try {
    const { role, id } = req;
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;
    if (role) {
      const users = await emplyeeModel
        .find({
          HrAdminId: id,
          isActive: true,
        })
        .skip(skip)
        .limit(limit)
        .exec();
      const usersBlock = await emplyeeModel
        .find({
          HrAdminId: id,
          isActive: false,
        })

        .skip(skip)
        .limit(limit);

      const total = await emplyeeModel.countDocuments();
      return res.status(200).json({ users, usersBlock, total });
    } else {
      return res.status(403).json({ message: "Access denied" });
    }
  } catch (error) {
    console.error("Error in /get-all-user:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});
authrouter.get("/get-emlyee-Id/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const findId = await emplyeeModel.findById(id).populate('bennifits')

    res.status(200).json({
      data: findId,
    });
  } catch (error) {
    console.error("Error in /get-all-user:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});
authrouter.patch("/block_active/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (isActive === true) {
      await emplyeeModel.findByIdAndUpdate(id, {
        changeResinedDate: Date.now(), // ใส่วงเล็บเรียกค่า timestamp ตอนนี้
        isActive: true,
      });
    } else {
      await emplyeeModel.findByIdAndUpdate(id, {
        resignedDate: Date.now(),
        isActive: false,
      });
    }

    res.status(200).json({
      message: "block successfully",
    });
  } catch (error) {
    console.error("Error in /block_active/:id:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});
//
authrouter.get("/auth/check", (req, res) => {
  const token = req.cookies.authToken;
  if (!token) return res.status(401).json({ message: "Unauthorized" });
  // เช็ค token
  jwt.verify(token, process.env.TOKEN_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: "Unauthorized" });
    res.status(200).json({ message: "Authorized", user: decoded });
  });
});
module.exports = authrouter;
