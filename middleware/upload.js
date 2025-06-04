const multer = require("multer");
const path = require("path");
// ตั้งค่า multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../uploads");
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname.replace(
      /\s+/g,
      "-"
    )}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "application/pdf",
      "text/csv", // MIME type สำหรับ CSV
      "application/json", // MIME type สำหรับ JSON
      "application/vnd.ms-excel", // MIME type สำหรับ .xls
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // MIME type สำหรับ .xlsx
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("ไฟล์ต้องเป็น JPEG, PNG, หรือ PDF เท่านั้น"));
    }
  },
});

// Error handling สำหรับ multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res
      .status(400)
      .json({ message: `Multer error: ${err.message}`, field: err.field });
  } else if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
};

// Debug middleware
const debugRequest = (req, res, next) => {
  next();
};
module.exports = {
  upload,
  handleMulterError,
  debugRequest,
};
