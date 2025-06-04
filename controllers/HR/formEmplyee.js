const Employee = require("../../models/emplyeeModel"); // Fixed typo in model path
const cloudinary = require("../../utils/cloudinary");
const fs = require("fs").promises;

// ฟังก์ชันช่วยอัปโหลดไฟล์ไป Cloudinary
const uploadToCloudinary = async (file) => {
  try {
    // ตรวจสอบว่าไฟล์มีอยู่
    await fs.access(file.path);
    const result = await cloudinary.uploader.upload(file.path, {
      folder: "employees",
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

// สร้างพนักงานใหม่
const createEmployee = async (req, res) => {
  try {
    if (!req.body && !req.files) {
      return res
        .status(400)
        .json({ message: "ไม่ได้รับข้อมูลหรือไฟล์ใดๆ จาก FormData" });
    }
    // Parse ข้อมูลอื่นๆ
    const {
      personalInfo = "{}",
      educationHistory = "[]",
      workExperience = "[]",
      employmentInfo = "{}",
      salaryInfo = "{}",
      department,
      position
    } = req.body || {};
    const { id } = req;
    const parsedDepartment = Object.assign(department);
    const parsedPosition = Object.assign(position);
    let socialSecurity = req.body.socialSecurity;
    if (typeof socialSecurity === "string") {
      try {
        socialSecurity = JSON.parse(socialSecurity);
      } catch (err) {
        console.error("JSON parse error:", err);
      }
    }
    const pathsocialSecurity = socialSecurity.map((item) => ({
      type: item.type,
      rate: item.rate,
      registrationPlace: item.registrationPlace,
      registrationDate: new Date(item.registrationDate), // แปลงเป็น Date object
    }));
    const parsedPersonalInfo =
      typeof personalInfo === "string"
        ? JSON.parse(personalInfo || "{}")
        : personalInfo;
    const parsedEducationHistory =
      typeof educationHistory === "string"
        ? JSON.parse(educationHistory || "[]")
        : educationHistory;
    const parsedWorkExperience =
      typeof workExperience === "string"
        ? JSON.parse(workExperience || "[]")
        : workExperience;
    const parsedEmploymentInfo =
      typeof employmentInfo === "string"
        ? JSON.parse(employmentInfo || "{}")
        : employmentInfo;
    const parsedSalaryInfo =
      typeof salaryInfo === "string"
        ? JSON.parse(salaryInfo || "{}")
        : salaryInfo;

    const files = req.files || {};

    // อัปโหลดไฟล์
    if (files["personalInfo[profileImage]"]?.[0]) {
      parsedPersonalInfo.profileImage = await uploadToCloudinary(
        files["personalInfo[profileImage]"][0]
      );
    }
    if (files["personalInfo[idCardImage]"]?.[0]) {
      parsedPersonalInfo.idCardImage = await uploadToCloudinary(
        files["personalInfo[idCardImage]"][0]
      );
    }

    // ทำให้การอัปโหลด certificates เป็น Promise ที่สามารถรอได้
    const educationPromises = parsedEducationHistory.map(async (edu, index) => {
      const fieldName = `educationHistory[${index}][certificate]`;
      if (files[fieldName]?.[0]) {
        edu.certificate = await uploadToCloudinary(files[fieldName][0]);
      }
      return edu;
    });

    // รอให้การอัปโหลด certificates เสร็จสิ้น
    const updatedEducationHistory = await Promise.all(educationPromises);

    // ทำให้การอัปโหลด workExperience files เป็น Promise ที่สามารถรอได้
    const workPromises = parsedWorkExperience.map(async (work, index) => {
      const fieldName = `workExperience[${index}][referenceFile]`;
      if (files[fieldName]?.[0]) {
        work.referenceFile = await uploadToCloudinary(files[fieldName][0]);
      }
      return work;
    });

    // รอให้การอัปโหลด workExperience files เสร็จสิ้น
    const updatedWorkExperience = await Promise.all(workPromises);

    if (files["employmentInfo[contractFile]"]?.[0]) {
      parsedEmploymentInfo.contractFile = await uploadToCloudinary(
        files["employmentInfo[contractFile]"][0]
      );
    }
     const randomNumber = Math.floor(Math.random() * 1000000);
    // const idString = Object.values(parsedEmploymentInfo.department).join("");
    const employeeData = {
      HrAdminId: id,
      emplyeebarCode: randomNumber,
      personalInfo: parsedPersonalInfo, ///parse
      educationHistory: updatedEducationHistory, //array
      workExperience: updatedWorkExperience, //array
      employmentInfo: parsedEmploymentInfo, //parse
      salaryInfo: parsedSalaryInfo, ///parse
      socialSecurity: pathsocialSecurity, // ใช้ข้อมูลที่กรองแล้ว
      department: {
        departmentId: parsedDepartment.departmentId,
        type: parsedDepartment.type,
        _id: parsedDepartment._id,
      },
      position: {
        level: parsedPosition.level,
        positionId: parsedPosition.positionId,
        type: parsedPosition.type,
        _id: parsedPosition._id,
      },
    };

    // ตรวจสอบข้อมูล
    if (!employeeData.personalInfo.fullName || !employeeData.personalInfo.dob) {
      return res
        .status(400)
        .json({ message: "กรุณากรอกชื่อและวันเดือนปีเกิด" });
    }

    const employee = new Employee(employeeData);
    await employee.save();

    res.status(201).json({ message: "บันทึกข้อมูลพนักงานสำเร็จ", employee });
  } catch (error) {
    console.error("Error creating employee:", error);
    if (req.files) {
      for (const field in req.files) {
        for (const file of req.files[field]) {
          await fs.unlink(file.path).catch(() => {});
        }
      }
    }
    res.status(500).json({
      message: "เกิดข้อผิดพลาดในการบันทึกข้อมูล",
      error: error.message,
    });
  }
};

// ดึงข้อมูลพนักงานทั้งหมด
exports.getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find({ isActive: true });
    res.status(200).json(employees);
  } catch (error) {
    console.error("Error fetching employees:", error);
    res
      .status(500)
      .json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูล", error: error.message });
  }
};

const getIdEmlyries = async (req, res) => {
  try {
    const { id } = req.params;
    const finded = await Employee.findById(id);
    res.status(200).json({
      data: finded,
    });
  } catch (err) {
    console.log(err);
  }
};

// Edit employee function
const editEmployee = async (req, res) => {
  try {
    // ตรวจสอบว่ามีข้อมูลหรือไฟล์ส่งมาหรือไม่
    if (!req.body && !req.files) {
      return res.status(400).json({ message: "ບໍ່ໄດ້ຮັບຂໍ້ມູນຈາກ FormData" });
    }

    // รับ id จาก params หรือ body (ขึ้นอยู่กับโครงสร้าง API)
    const { id } = req.params; // หรือ req.body.id ตามการออกแบบ API
    if (!id) {
      return res.status(400).json({ message: "ກະລຸນາລະບຸ ID ພະນັກງານ" });
    }

    // ค้นหาพนักงานในฐานข้อมูล
    const existingEmployee = await Employee.findById(id);
    if (!existingEmployee) {
      return res.status(404).json({ message: "ບໍ່ພົບ ID ນີ້" });
    }

    // Parse ข้อมูลจาก req.body
    const {
      personalInfo = "{}",
      educationHistory = "[]",
      workExperience = "[]",
      employmentInfo = "{}",
      salaryInfo = "{}",
      socialSecurity = "[]",
      department = "{}",
      position = "{}",
    } = req.body || {};
    // Parse socialSecurity
    let parsedSocialSecurity = socialSecurity;
    if (typeof socialSecurity === "string") {
      try {
        parsedSocialSecurity = JSON.parse(socialSecurity);
      } catch (err) {
        console.error("JSON parse error for socialSecurity:", err);
        return res
          .status(400)
          .json({ message: "ຮູບແບບຂໍ້ມູນ socialSecurity ບໍ່ຖືກຕ້ອງ" });
      }
    }

    const pathsocialSecurity = parsedSocialSecurity.map((item) => ({
      type: item.type || "",
      rate: item.rate || "",
      registrationPlace: item.registrationPlace || "",
      registrationDate: item.registrationDate
        ? new Date(item.registrationDate)
        : null,
    }));

    // Parse ข้อมูลอื่นๆ
    const parsedPersonalInfo =
      typeof personalInfo === "string"
        ? JSON.parse(personalInfo || "{}")
        : personalInfo;
    const parsedEducationHistory =
      typeof educationHistory === "string"
        ? JSON.parse(educationHistory || "[]")
        : educationHistory;
    const parsedWorkExperience =
      typeof workExperience === "string"
        ? JSON.parse(workExperience || "[]")
        : workExperience;
    const parsedEmploymentInfo =
      typeof employmentInfo === "string"
        ? JSON.parse(employmentInfo || "{}")
        : employmentInfo || {};
    const parsedSalaryInfo =
      typeof salaryInfo === "string"
        ? JSON.parse(salaryInfo || "{}")
        : salaryInfo;
    const parsedDepartment = Object.assign(department);
    const parsedPosition = Object.assign(position);

    const files = req.files || {};
    if (files["personalInfo[profileImage]"]?.[0]) {
      parsedPersonalInfo.profileImage = await uploadToCloudinary(
        files["personalInfo[profileImage]"][0]
      );
    } else {
      parsedPersonalInfo.profileImage =
        existingEmployee.personalInfo.profileImage; // คงค่าเดิม
    }

    if (files["personalInfo[idCardImage]"]?.[0]) {
      parsedPersonalInfo.idCardImage = await uploadToCloudinary(
        files["personalInfo[idCardImage]"][0]
      );
    } else {
      parsedPersonalInfo.idCardImage =
        existingEmployee.personalInfo.idCardImage; // คงค่าเดิม
    }

    // อัปโหลดไฟล์สำหรับ educationHistory
    const educationPromises = parsedEducationHistory.map(async (edu, index) => {
      const fieldName = `educationHistory[${index}][certificate]`;
      if (files[fieldName]?.[0]) {
        edu.certificate = await uploadToCloudinary(files[fieldName][0]);
      } else {
        // คงค่า certificate เดิมถ้าไม่มีไฟล์ใหม่
        edu.certificate =
          existingEmployee.educationHistory[index]?.certificate || null;
      }
      return edu;
    });

    const updatedEducationHistory = await Promise.all(educationPromises);

    // อัปโหลดไฟล์สำหรับ workExperience
    const workPromises = parsedWorkExperience.map(async (work, index) => {
      const fieldName = `workExperience[${index}][referenceFile]`;
      if (files[fieldName]?.[0]) {
        work.referenceFile = await uploadToCloudinary(files[fieldName][0]);
      } else {
        // คงค่า referenceFile เดิมถ้าไม่มีไฟล์ใหม่
        work.referenceFile =
          existingEmployee.workExperience[index]?.referenceFile || null;
      }
      return work;
    });

    const updatedWorkExperience = await Promise.all(workPromises);

    if (files["employmentInfo[contractFile]"]?.[0]) {
      parsedEmploymentInfo.contractFile = await uploadToCloudinary(
        files["employmentInfo[contractFile]"][0]
      );
    } else {
      parsedEmploymentInfo.contractFile =
        existingEmployee.employmentInfo.contractFile; // คงค่าเดิม
    }
    // const idString = Object.values(parsedEmploymentInfo.department).join("");
    // console.log(idString); // 682c17491cde3a4cd38c4c3f
    // เตรียมข้อมูลสำหรับอัปเดต
    const employeeData = {
      personalInfo: {
        ...existingEmployee.personalInfo, // คงค่าเดิม
        ...parsedPersonalInfo, // อัปเดตด้วยค่าที่ส่งมา
      },
      department: {
        departmentId: parsedDepartment.departmentId,
        type: parsedDepartment.type,
        _id: parsedDepartment._id,
      },
      position: {
        level: parsedPosition.level,
        positionId: parsedPosition.positionId,
        type: parsedPosition.type,
        _id: parsedPosition._id,
      },
      educationHistory: updatedEducationHistory.length
        ? updatedEducationHistory
        : existingEmployee.educationHistory, // ใช้ค่าเดิมถ้าไม่ส่งมา
      workExperience: updatedWorkExperience.length
        ? updatedWorkExperience
        : existingEmployee.workExperience, // ใช้ค่าเดิมถ้าไม่ส่งมา
      employmentInfo: {
        ...existingEmployee.employmentInfo,
        ...parsedEmploymentInfo,
      },
      salaryInfo: {
        ...existingEmployee.salaryInfo,
        ...parsedSalaryInfo,
      },
      // DepartmentLink: idString,
      socialSecurity: pathsocialSecurity.length
        ? pathsocialSecurity
        : existingEmployee.socialSecurity, // ใช้ค่าเดิมถ้าไม่ส่งมา
    };

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!employeeData.personalInfo.fullName || !employeeData.personalInfo.dob) {
      return res
        .status(400)
        .json({ message: "ກະລຸນາເພີ່ມຊື່ ແລະ ວັນເດືອນປີເກີດ" });
    }

    // อัปเดตข้อมูลในฐานข้อมูล
    const updatedEmployee = await Employee.findByIdAndUpdate(
      id,
      { $set: employeeData },
      { new: true, runValidators: true } // new: true เพื่อ return เอกสารที่อัปเดต, runValidators: true เพื่อตรวจสอบ schema
    );

    if (!updatedEmployee) {
      return res.status(404).json({ message: "ບໍ່ສາມາດອັບເດດພະນັກງານໄດ້" });
    }

    res.status(200).json({
      message: "ອັບເດດສຳເລັດ",
      employee: updatedEmployee,
    });
  } catch (error) {
    console.error("Error updating employee:", error);

    // Cleanup ไฟล์ที่อัปโหลดชั่วคราวถ้าเกิดข้อผิดพลาด
    if (req.files) {
      for (const field in req.files) {
        for (const file of req.files[field]) {
          await fs.unlink(file.path).catch((err) => {
            console.error("Error deleting file:", err);
          });
        }
      }
    }

    res.status(500).json({
      message: "ເກີດຂໍ້ຜິດພາດ",
      error: error.message,
    });
  }
};

module.exports.createEmployee = createEmployee;
module.exports.getIdEmlyries = getIdEmlyries;
module.exports.editEmployee = editEmployee;
