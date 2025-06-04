const LeaveRequest = require("../../models/leaveholidaysForm");
const emplyeeModel = require("../../models/emplyeeModel");
const data = require("../../models/dataEmplyee");
const saveLeave = async (req, res) => {
  try {
    const {
      HrAdminId,
      leaveType,
      startDate,
      endDate,
      reason,
      emplyeeCode,
    } = req.body;
    const newData = new LeaveRequest({
      HrAdminId: HrAdminId,
      leaveType: leaveType,
      startDate: startDate,
      endDate: endDate,
      reason: reason,
      emplyeeCode: Number(emplyeeCode),
    });
    await newData.save();
    res.status(200).json({
      data: newData,
    });
  } catch (error) {
    console.error("Create employee error:", error);
    res.status(500).json({ error: "Failed to create employee" });
  }
};
const getLeave = async (req, res) => {
  try {
    const { id } = req;
    const leaveRequests = await LeaveRequest.find({ HrAdminId: id });
    res.status(200).json({
      success: true,
      data: leaveRequests, // ส่ง dataset กลับไป
    });
  } catch (err) {
    console.error("Error in getLeave:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
const statusAllow = async (req, res) => {
  const { leaveId } = req.params;
  const { id } = req;
  const { status } = req.body;
  const [employees, holidayData] = await Promise.all([
    emplyeeModel.find({ HrAdminId: id }),
    data.find({ HrAdminId: id }),
  ]);

  try {
    //check ວ່າ ການສົ່ງຄຳຂໍມາມີໃນຖານບໍ່
    ///ດັກຖ້າບໍ່ມີຫົວຂໍ້ໃນຖານຈະບໍ່ສາມາດກົດບັນທືກໄດ້
    const contentCheck = await LeaveRequest.findById(leaveId);
    const contentExists = holidayData.some((item) =>
      item.contentsOfHolidays.some((i) => i.content === contentCheck.leaveType)
    );
    if (!contentExists) {
      return res.status(400).json({ message: "ບໍ່ມີໃນຖານ holiday ຂໍ້ມູນຂໍລາ" });
    }
    ///continue
    const updatedLeave = await LeaveRequest.findByIdAndUpdate(
      leaveId,
      {
        status: status,
        approvedBy: id,
        approvedAt: new Date(),
      },
      { new: true }
    );

    ///ວັນເລີມພັກ
    const startDate = new Date(updatedLeave.startDate);
    //ວັນສິ້ນສຸດພັກ
    const endDate = new Date(updatedLeave.endDate);
    //ຫາຈຳນວນມື້ພັກ
    const diffDays =
      Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    ///ປະຕິເສດອະນຸມັດ
    if (updatedLeave.status === "rejected") {
      for (const element1 of holidayData) {
        for (const item1 of element1.contentsOfHolidays) {
          console.log(item1);
          const employee1 = employees.find(
            (e) => e.emplyeebarCode === updatedLeave.emplyeeCode
          );
          if (employee1 && updatedLeave.leaveType === item1.content) {
            const targetDataset1 = employee1.dataset.find(
              (d) => d.content === updatedLeave.leaveType
            );
            if (targetDataset1) {
              await emplyeeModel.updateOne(
                {
                  emplyeebarCode: updatedLeave.emplyeeCode,
                  "dataset._id": targetDataset1._id,
                },
                {
                  $inc: {
                    "dataset.$.countholidayreq": -diffDays,
                    "dataset.$.countsix": diffDays, // ลดตามจำนวนที่ลา
                  },
                }
              );
            }
          }
        }
      }
    }
    if (!updatedLeave) {
      return res.status(404).json({ message: "Leave not found." });
    }

    ////ຕ້ອງເທົ່າ ອະນຸມັດຈຶງຜ່ານ
    if (updatedLeave.status !== "approved") {
      return res.status(200).json({ message: "Leave status updated." });
    }
    for (const element of holidayData) {
      for (const item of element.contentsOfHolidays) {
        const employee = employees.find(
          (e) => e.emplyeebarCode === updatedLeave.emplyeeCode
        );

        if (employee && updatedLeave.leaveType === item.content) {
          const countsix = item.countday - diffDays;

          // หา dataset ของพนักงานนี้ก่อน
          const targetDataset = employee.dataset.find(
            (d) => d.content === updatedLeave.leaveType
          );

          if (targetDataset) {
            if (targetDataset.countsix === 0) {
              await LeaveRequest.findByIdAndUpdate(
                leaveId,
                {
                  status: "cancel",
                  approvedBy: id,
                  approvedAt: new Date(),
                },
                { new: true }
              );
              return res.status(400).json({
                message: `ວັນລາຂອງລາຍການນີ້ໝົດແລ້ວ ${updatedLeave.leaveType}`,
              });
            }
            if (targetDataset.countsix < diffDays) {
              await LeaveRequest.findByIdAndUpdate(
                leaveId,
                {
                  status: "cancel",
                  approvedBy: id,
                  approvedAt: new Date(),
                },
                { new: true }
              );
              return res.status(400).json({
                message: `ຈຳນວນວັນລາຄົງເຫຼືອ ${targetDataset.countsix} ມິພໍສໍາລັບການຂໍລາ ${diffDays} ວັນ`,
              });
            }
            // อัปเดตค่าที่เจาะจงตัวนั้นใน dataset array
            await emplyeeModel.updateOne(
              {
                emplyeebarCode: updatedLeave.emplyeeCode,
                "dataset._id": targetDataset._id,
              },
              {
                $inc: {
                  "dataset.$.countholidayreq": diffDays,
                  "dataset.$.countsix": -diffDays, // ลดตามจำนวนที่ลา
                },
              }
            );
          } else {
            // ถ้ายังไม่มี record นี้ใน dataset → เพิ่มใหม่
            await emplyeeModel.updateOne(
              { emplyeebarCode: updatedLeave.emplyeeCode },
              {
                $push: {
                  dataset: {
                    countday: item.countday,
                    countsix: countsix,
                    countholidayreq: diffDays,
                    content: item.content,
                    matchedEmployee: employee.emplyeebarCode,
                    leaveId: updatedLeave._id,
                  },
                },
              }
            );
          }
        }
      }
    }

    return res
      .status(200)
      .json({ message: "Leave approved and dataset updated." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error." });
  }
};
const getLeaveId = async (req, res) => {
  const { idOne } = req.params;
  const { id } = req; // หรือ req.body / req.query แล้วแต่ว่าได้ id มาจากไหน
  try {
    const getId = await LeaveRequest.find({
      emplyeeCode: Number(idOne),
      HrAdminId: id,
      status: "approved",
    });

    if (!getId) {
      return res.status(404).json({ message: "Leave request not found." });
    }
    console.log(getId);
    return res.status(200).json({
      data: getId,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error." });
  }
};
module.exports.saveLeave = saveLeave;
module.exports.getLeave = getLeave;
module.exports.statusAllow = statusAllow;
module.exports.getLeaveId = getLeaveId;
