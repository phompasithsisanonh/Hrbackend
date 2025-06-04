// Controller: dataEmployeeController.js
const DataEmployee = require("../models/dataEmplyee");
const departmentId = require("../models/departmentModel");
// Add new employee data
const addDataEmployee = async (req, res) => {
  try {
    const {
      otTohour,
      typeCommission,
      setAnnualHolidays,
      typeOfSecurity,
      department,
      otminute,
    } = req.body;
    const { id, role } = req;
    // Validate required fields
    if (!otTohour || !setAnnualHolidays) {
      return res.status(400).json({
        success: false,
        message: "Required fields are missing",
      });
    }

    // Create new data entry
    const newDataEmployee = new DataEmployee({
      HrAdminId: id,
      otTohour,
      otminute,

      typeCommission: typeCommission || [],
      setAnnualHolidays,
      typeOfSecurity: typeOfSecurity || [],
      department: department || [],
    });

    // Save to database
    const savedData = await newDataEmployee.save();

    return res.status(201).json({
      success: true,
      message: "Employee data added successfully",
      data: savedData,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Failed to add employee data",
      error: error.message,
    });
  }
};
// Get one id employee data
const getOneIdDataEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await DataEmployee.findById(id);
    return res.status(200).json({
      success: true,
      data: data,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve employee data",
      error: error.message,
    });
  }
};
// Get all employee data
const getAllDataEmployee = async (req, res) => {
  try {
    const { id, role } = req;
    const data = await DataEmployee.find({
      HrAdminId: id,
    });
    return res.status(200).json({
      success: true,
      count: data.length,
      data: data,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve employee data",
      error: error.message,
    });
  }
};
const editdatabase = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      otTohour,
      otminute,
      latTohour,
      latminute,
      startWorkTime,
      standardTimeWorkHour,
      typeCommission,
      setAnnualHolidays,
      typeOfSecurity,
      department,
      contentsOfHolidays,
    } = req.body;
    // ดึงข้อมูลพนักงานปัจจุบัน
    const existingEmployee = await DataEmployee.findById(id);

    if (!existingEmployee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // สร้างสำเนาของ departments ปัจจุบัน (หรือ array ว่างถ้าไม่มีข้อมูล)
    const updatedDepartments = [...(existingEmployee.department || [])];

    // วนลูปผ่านแต่ละ department ที่ส่งมาใน req.body
    for (const newDept of department) {
      // ตรวจสอบว่ามี department นี้อยู่แล้วหรือไม่
      const existingDeptIndex = updatedDepartments.findIndex(
        (dept) => dept.type === newDept.type
      ); /// index==0

      if (existingDeptIndex !== -1) {
        // ถ้ามี department อยู่แล้ว ให้เพิ่ม position ใหม่เข้าไป
        updatedDepartments[existingDeptIndex].position = [
          ...updatedDepartments[existingDeptIndex].position,
          ...(newDept.position || []),
        ];
      } else {
        // ถ้าไม่มี department นี้ ให้เพิ่ม department ใหม่
        updatedDepartments.push(newDept);
      }
    }

    // อัพเดทข้อมูลพนักงาน
    const data = await DataEmployee.findByIdAndUpdate(
      id,
      {
        otTohour,
        otminute,
        latTohour,
        latminute,
        contentsOfHolidays,
        startWorkTime,
        standardTimeWorkHour,
        typeCommission,
        setAnnualHolidays,
        typeOfSecurity,
        department: updatedDepartments,
      },
      { new: true }
    );
    // const checkDepartment = await departmentId?.findOne({
    //   Department_id: data._id,
    // });
    // if (!checkDepartment) {
    //   const departmentIdes = new departmentId({
    //     Department_id: data._id,
    //   });
    //   await departmentIdes.save();
    // } else {
    //   await departmentId.findByIdAndUpdate(
    //     checkDepartment._id,
    //     {
    //       Department_id: data._id,
    //     },
    //     { new: true }
    //   );
    // }
    return res.status(200).json({
      success: true,
      message: "Employee data updated successfully",
      data,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Error updating employee data",
      error: error.message,
    });
  }
};
//edit_deparment
const edit_deparmentPosition = async (req, res) => {
  try {
    const { id } = req.params;
    const { editedPosition, type } = req.body; // editedPosition เป็น array

    const finddatabase = await DataEmployee.findById(id);
    if (!finddatabase) {
      return res.status(401).json({
        message: "ບໍ່ມີຂໍ້ມູນທີ່ຮ້ອງຂໍ",
      });
    }

    // หาแผนกที่ตรงกับ type ค้นหาตำแหน่ง index การเงิน
    const departmentIndex = finddatabase.department.findIndex(
      (dept) => dept.type === type
    );

    if (departmentIndex === -1) {
      return res.status(404).json({
        message: "ບໍ່ພົບພະແນກທີ່ລະບຸ",
      });
    }

    // ถ้า editedPosition เป็น array ຟັ່ງຊັ່ນແກ້ໄຂຕຳແໜ່ງ
    if (Array.isArray(editedPosition)) {
      // วนลูปผ่านแต่ละรายการใน editedPosition
      editedPosition.forEach((item) => {
        if (item.index !== undefined) {
          // ตรวจสอบว่ามี index ไหม
          const posIndex = finddatabase.department[
            departmentIndex
          ].position.forEach((pos, idx) => {
            if (item.index === idx) {
              finddatabase.department[departmentIndex].position[idx].type =
                item.newValue;
            }
          });
          console.log("pos", posIndex);
        }
      });
    } else {
      return res.status(400).json({
        message: "รูปแบบข้อมูลไม่ถูกต้อง editedPosition ต้องเป็น array",
      });
    }

    // บันทึกการเปลี่ยนแปลง
    await finddatabase.save();

    return res.status(200).json({
      message: "ແກ້ໄຂຕຳແໜ່ງສຳເລັດແລ້ວ",
      data: finddatabase,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "ເກີດຂໍ້ຜິດພາດ",
      error: err.message,
    });
  }
};
const deletedatabasetypeSecurity = async (req, res) => {
  const { settingId, index } = req.params;
  console.log(index);
  try {
    const setting = await DataEmployee.findById(settingId);
    if (!setting) {
      return res.status(404).json({ message: "ບໍພົບຂໍ້ມູນ" });
    }
    //ຖ້າສົ່ງຂໍ້ມູນມາຄື 1 ແລ້ວໃນຖານມີແຕ່ 1 1<0,pass/  1>=1 not passsຈຶ່ງເກີດເງືຶອນໄຂນີ້
    if (index < 0 || index >= setting.typeOfSecurity.length) {
      return res.status(400).json({ message: "index ບໍ່ຖືກຕ້ອງ" });
    }

    setting.typeOfSecurity.splice(index, 1);
    await setting.save();

    res.json({ message: "ລົບສຳເລັດ" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const deletedatabaseholidays = async (req, res) => {
  const { settingId, index } = req.params;
  try {
    console.log(settingId);
    const setting = await DataEmployee.findById(settingId);
    if (!setting) {
      return res.status(404).json({ message: "ບໍພົບຂໍ້ມູນ" });
    }
    //ຖ້າສົ່ງຂໍ້ມູນມາຄື 1 ແລ້ວໃນຖານມີແຕ່ 1 1<0,pass/  1>=1 not passsຈຶ່ງເກີດເງືຶອນໄຂນີ້
    if (index < 0 || index >= setting.contentsOfHolidays.length) {
      return res.status(400).json({ message: "index ບໍ່ຖືກຕ້ອງ" });
    }

    setting.contentsOfHolidays.splice(index, 1);
    await setting.save();

    res.json({ message: "ລົບສຳເລັດ" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const getDepartment = async (req, res) => {
  try {
    const data = await departmentId.find().populate("Department_id");
    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }
    return res.status(200).json({
      success: true,
      data: data,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve department data",
      error: error.message,
    });
  }
};
module.exports.addDataEmployee = addDataEmployee;
module.exports.getAllDataEmployee = getAllDataEmployee;
module.exports.getOneIdDataEmployee = getOneIdDataEmployee;
module.exports.editdatabase = editdatabase;
module.exports.edit_deparmentPosition = edit_deparmentPosition;
module.exports.deletedatabasetypeSecurity = deletedatabasetypeSecurity;
module.exports.deletedatabaseholidays = deletedatabaseholidays;
module.exports.getDepartment  = getDepartment ;
