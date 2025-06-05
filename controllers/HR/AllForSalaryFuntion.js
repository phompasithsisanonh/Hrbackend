const dataAlreadySalaryTranform = require("../../models/dataAlreadySalaryTranform");
const TaxModel = require("../../models/taxModel");
const employee = require("../../models/emplyeeModel");
const dataOted = require("../../models/exportFileIn_out");
const receiptPaymentSalary = require("../../models/receiptPaymentSalary");
const addDataSalary = async (req, res) => {
  try {
    const { id } = req;
    const {
      emplyeecode,
      calculateTimeLateHour,
      calculateTimeLateMinute,
      calculateTimeOThour,
      calculateTimeOTminute,
      incomeNet,
      salaryfirst,
      baseSalary,
      socialSecurity,
      date,
      personalInfo,
      month,
      year,
      otId,
      bennifits,
    } = req.body;
    const newSalary = new dataAlreadySalaryTranform({
      HrAdminId: id,
      emplyeecode,
      date,
      calculateTimeLateHour,
      calculateTimeLateMinute,
      calculateTimeOThour,
      calculateTimeOTminute,
      incomeNet,
      salaryfirst,
      baseSalary,
      socialSecurity,
      personalInfo,
      month,
      year,
      otId,
      bennifits,
    });
    await newSalary.save();
    res.status(201).json({
      message: "ຈັດເກັບຂໍ້ມູນແລ້ວ",
      data: newSalary,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllDataSalary = async (req, res) => {
  try {
    const { id } = req;
    const data = await dataAlreadySalaryTranform.find({
      HrAdminId: id,
    });
    res.status(200).json({
      data: data,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const saveTax = async (req, res) => {
  try {
    const { id, role } = req;
    const { incomes } = req.body;
    console.log(id);
    for (let i = 0; i < incomes.length; i++) {
      ``;
      const newTax = new TaxModel({
        HrAdminId: id,
        id: incomes[i].id,
        minAmount: incomes[i].minAmount,
        maxAmount: incomes[i].maxAmount,
        rate: incomes[i].rate,
      });
      await newTax.save();
    }
    res.status(200).json({
      message: "ຈັດເກັບຂໍ້ມູນແລ້ວ",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const getTax = async (req, res) => {
  try {
    const { id, role } = req;
    const tax = await TaxModel.find({
      HrAdminId: id,
    });
    res.status(200).json({
      data: tax,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const editTax = async (req, res) => {
  const { id, minAmount, maxAmount, rate } = req.body;

  try {
    const filtered = await TaxModel.findOne({ id: id });
    if (minAmount < filtered.minAmount) {
      res.status(404).json({
        message: "ຄ່າຕໍ່າສູດບໍ່ສາມາດຕໍ່າກວ່າຄ່າເດີມ",
      });
      return false;
    }
    const finded = await TaxModel.findOneAndUpdate(
      { id: id },
      {
        minAmount,
        maxAmount,
        rate,
      },
      { new: true, runValidators: true }
    );
    await finded.save();
    res.status(200).json({
      message: "ບັນທຶກການປ່ຽນແປງສຳເລັດ",
    });
  } catch (err) {
    console.log(err);
  }
};
const deleteTax = async (req, res) => {
  const { id } = req.params;
  console.log(id);
  try {
    const deletedTax = await TaxModel.findOneAndDelete({ id: id });
    if (!deletedTax) {
      res.status(404).json({
        message: "ບໍ່ພົບຂໍ້ມູນທີ່ຈະລົບ",
      });
      return;
    }
    res.status(200).json({
      message: "ລົບຂໍ້ມູນສຳເລັດ",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const cardForSummary = async (req, res) => {
  try {
    const { id } = req;

    const dataOt = await dataOted.find({ HrAdminId: id }); ////ot
    const get_all_user_em = await employee
      .find({
        HrAdminId: id,
        isActive: true,
      })
      .populate("bennifits");

    const data = [];

    get_all_user_em.forEach((employeeItem) => {
      const emplyeecode = employeeItem.emplyeebarCode;

      const employeeOtData = dataOt.filter(
        (ot) => ot.emplyeecode === emplyeecode
      );

      employeeOtData.forEach((otItem) => {
        const date = new Date(otItem.date);
        const month = date.getMonth();
        const year = date.getFullYear();

        const existing = data.find(
          (item) =>
            item.emplyeecode === emplyeecode &&
            item.month === month &&
            item.year === year
        );

        if (existing) {
          existing.id = otItem._id;
          (existing.bennifits = employeeItem.bennifits),
            (existing.calculateTimeLateHour += otItem.calculateTimeLateHour);
          existing.calculateTimeLateMinute += otItem.calculateTimeLateMinute;
          existing.calculateTimeOThour += otItem.calculateTimeOThour;
          existing.calculateTimeOTminute += otItem.calculateTimeOTminute;
          existing.incomeNet += otItem.incomeNet;
          existing.month = month;
          existing.year = year;
          existing.salaryfirst =
            existing.incomeNet + employeeItem.salaryInfo.baseSalary;
        } else {
          data.push({
            emplyeecode,
            id: otItem._id,
            personalInfo: employeeItem.personalInfo,
            calculateTimeLateHour: otItem.calculateTimeLateHour,
            calculateTimeLateMinute: otItem.calculateTimeLateMinute,
            calculateTimeOThour: otItem.calculateTimeOThour,
            calculateTimeOTminute: otItem.calculateTimeOTminute,
            incomeNet: otItem.incomeNet,
            date: otItem.date,
            month: month,
            year: year,
            salaryInfo: employeeItem.salaryInfo,
            socialSecurity: employeeItem.socialSecurity,
            salaryfirst: otItem.incomeNet + employeeItem.salaryInfo.baseSalary,
            bennifits: employeeItem.bennifits,
          });
        }
      });
    });

    res.status(200).json({ data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};
const CancelCardSummary = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(404).json({
        message: "ບໍ່ພົບຂໍ້ມູນ",
      });
    }
    const deletefind = await dataAlreadySalaryTranform.findOneAndDelete({
      otId: id,
    });
    if (deletefind) {
      res.status(200).json({
        message: "ລົບສຳເລັດ",
      });
    } else {
      res.status(404).json({
        message: "ບໍ່ມີໃນລະບົບ ຂໍອະໄພ",
      });
    }
  } catch (err) {
    console.log(err);
  }
};
const postsavepaySalary = async (req, res) => {
  try {
    const { id } = req;
    const {
      employeeCode,
      date,
      personalInfo,
      basicSalary,
      salaryFirst,
      socialSecurity,
      socialSecurityMoney,
      tax,
      netExpense,
      netIncome,
      netSalary,
      incomeItems,
      expenseItems,
      taxBracket,
      year,
      month,
      NetBennifits,
      totalTimeLate,
      totalTimeOt,
    } = req.body;
    // สร้างเอกสารใหม่
    const newSalaryReceipt = new receiptPaymentSalary({
      HrAdminId: id,
      employeeCode,
      personalInfo,
      date,
      basicSalary,
      salaryFirst,
      socialSecurity,
      socialSecurityMoney,
      tax,
      netExpense,
      netIncome,
      NetBennifits,
      netSalary,
      totalTimeLate,
      totalTimeOt,
      incomeItems,
      expenseItems,
      taxBracket,
      year,
      month,
    });

    // บันทึกลง database
    await newSalaryReceipt.save();

    // ตอบกลับ client
    res.status(201).json({
      message: "ບັນທຶກຂໍ້ມູນສຳເລັດ",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "ເກີດຂໍ້ພິດພາດ",
      error: err.message,
    });
  }
};
const getSalary = async (req, res) => {
  try {
    const { id } = req;
    const getsalary = await receiptPaymentSalary.find({
      HrAdminId: id,
    });
    res.status(200).json({
      data: getsalary,
    });
  } catch (err) {
    console.log(err);
  }
};
const addFormDataEdit = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      emplyeebarCode,
      fullName,
      filtercheckIdcode,
      inTime,
      outTime,
      date,
    } = req.body;

    const update = await dataOted.findByIdAndUpdate(
      id,
      {
        emplyeecode: emplyeebarCode,
        fullName,
        filtercheckIdcode,
        date,
        inTime,
        outTime,
      },
      { new: true, runValidators: true }
    );
    if (update) {
      res.status(200).json({
        message: "ອັບເດດສຳເລັດ",
      });
    } else {
      res.status(404).json({
        message: "ເກີດຂໍ້ຜິດຜາດ",
      });
    }
  } catch (err) {
    console.log(err);
  }
};
const paymentsuccess = async (req, res) => {};
const deletesalary = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedoc = await receiptPaymentSalary.findByIdAndDelete(id);
    if (deletedoc) {
      res.status(200).json({
        message: "ລົບສຳເລັດ",
      });
    } else {
      res.status(404).json({
        message: "ເກີດຂໍ້ຜິດຜາດ",
      });
    }
  } catch (err) {
    console.log(err);
  }
};
module.exports.addDataSalary = addDataSalary;
module.exports.getAllDataSalary = getAllDataSalary;
module.exports.saveTax = saveTax;
module.exports.getTax = getTax;
module.exports.editTax = editTax;
module.exports.deleteTax = deleteTax;
module.exports.cardForSummary = cardForSummary;
module.exports.postsavepaySalary = postsavepaySalary;
module.exports.getSalary = getSalary;
module.exports.paymentsuccess = paymentsuccess;
module.exports.CancelCardSummary = CancelCardSummary;
module.exports.addFormDataEdit = addFormDataEdit;
module.exports.deletesalary = deletesalary;
