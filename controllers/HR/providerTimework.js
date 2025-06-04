const fs = require("fs");
const InOut = require("../../models/exportFileIn_out");
const xlsx = require("xlsx");
const moment = require("moment");
const dataEmployee = require("../../models/dataEmplyee");
const emplyeeModel = require("../../models/emplyeeModel");
const dayjs = require("dayjs");
//import dayjs from 'dayjs' // ES 2015
dayjs().format();
function excelTimeValueToDate(timeValue) {
  const totalSeconds = Math.round(timeValue * 24 * 60 * 60);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const date = new Date();
  date.setHours(hours);
  date.setMinutes(minutes);
  date.setSeconds(seconds);
  date.setMilliseconds(0);

  // แสดงเวลาตาม Locale ประเทศไทย (ถ้า Server ตั้งค่าเป็นไทย)
  // หรือระบุ TimeZone โดยตรง
  const thaiTimeString = date.toLocaleTimeString("th-TH");
  return thaiTimeString;
}
const addFileWork = async (req, res) => {
  try {
    const { id } = req;
    const dataEm = await dataEmployee.find({
      HrAdminId: id,
    });
    if (!dataEm) {
      return res.status(404).json({ message: "ไม่พบข้อมูล" });
    }
    const dataOThour = dataEm[0]?.otTohour;
    const dataOTminute = dataEm[0]?.otminute;
    const dataLateTohour = dataEm[0]?.latTohour;
    const dataLateMinute = dataEm[0]?.latminute;
    const startWorkTime1 = dataEm[0]?.startWorkTime; //ເວລາເລີ່ມວຽກ
    const standardTimeWorkHour = dataEm[0]?.standardTimeWorkHour; //ເວລາເລີ່ມວຽກ
    const files = req.file || {};
    // อ่านไฟล์ XLSX
    const workbook = xlsx.readFile(files.path);
    // เลือก Sheet แรก (หรือ Sheet ที่ต้องการ)
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    // แปลงข้อมูลใน Sheet เป็น Array ของ Objects (JSON)
    const jsonData = xlsx.utils.sheet_to_json(worksheet);
    // วนลูปและบันทึกข้อมูลลง MongoDB
    // สร้าง array ของ filtercheckIdcode จาก dataEm
    const findInout = await InOut.find();
    const dataEmIds = findInout.map((item) => item.filtercheckIdcode);
    const filtercheck = jsonData.filter(
      (item) => !dataEmIds.includes(item.filtercheckIdcode)
    );
    for (const row of filtercheck) {
      try {
        //ກອງກ່ອນນຳໄປໃຊ້ງານ

        const inTimeValue = row.inTime; //ເວລາຈາກ Excel  ເຂົ້າວຽກ
        const outTimeValue = row.outTime; //ເວລາຈາກ Excel ເລີກວຽກ
        const inTimeJSDate = excelTimeValueToDate(inTimeValue); //ນຳໄປແປງເປັນເວລາ 08:30:00
        const outTimeJSDate = excelTimeValueToDate(outTimeValue); //ນຳໄປແປງເປັນເວລາ 17:30:00
        // ... ภายใน Loop ...
        const inTimeMoment = moment(inTimeJSDate, "h:mm:ss A"); //ເຂົ້າວຽກ
        const outTimeMoment = moment(outTimeJSDate, "h:mm:ss A"); //ເລີກວຽກ
        // ຫາເວລາໃນການຫາໂມງມາສາຍໃນຕອນເຊົ້າຫາຕອນແລງ
        const startWorkTime = moment(startWorkTime1, "HH:mm:ss"); //ເວລາເລີ່ມວຽກ
        const endWorkTime = moment(inTimeMoment, "HH:mm:ss"); //ເວລາເຂົ້າວຽກ
        const d = moment.duration(endWorkTime.diff(startWorkTime)); // ຄຳນວນຫາໄລຍະຫາຂອງເວລາ
        const hours = d.hours(); // 1
        const minutes = d.minutes(); // 0
        ///ຄຳນວນເວລາມາຊ້າ
        let calculateTimeLate = 0;
        let calculateTimeLateMinute = 0;
        if (hours >= 1 || minutes >= 30) {
          if (hours >= 1) {
            calculateTimeLate = hours * dataLateTohour;
          }
          if (minutes >= 30) {
            calculateTimeLateMinute += dataLateMinute;
          }
        }
        // ຫາເວລາເຂົ້າງານ OT
        const timeDifferenceMs =
          outTimeMoment.valueOf() - startWorkTime.valueOf();
        // แปลง milliseconds เป็น Duration Object ของ Moment.js
        const duration = moment.duration(timeDifferenceMs);
        const diffHours = duration.hours(); //ຈຳນວນຊົ່ວໂມງ
        const diffMinutes = duration.minutes(); //ຈຳນວນນາທີ
        const diffSeconds = duration.seconds(); //ຈຳນວນວິນາທີ
        let overTime = 0; //ຄຳນວນຫາຊົ່ວໂມງເກີນ
        let overTimeMinute = 0; //ຄຳນວນຫານາທີເກີນ
        if (
          diffHours >= standardTimeWorkHour ||
          diffMinutes > 0 ||
          diffSeconds == 0
        ) {
          //ຖ້າເວລາເຂົ້າງານເກິນ 9 ຊົ່ວໂມງ ຫຼືເທົາ 9  ຖ້ານາທີຫລາຍກວ່າ 0
          overTime = diffHours - standardTimeWorkHour; //ຈຳນວນຊົ່ວໂມງ ລົບ ຈຳນວນທີ່ເຂົ້າງານ 9 ຊົ່ວໂມງ ຖ້າເກີນຄື ຊົ່ວໂມງ OT
          overTimeMinute = diffMinutes; //ເກບໄວ້ໃນຕົວແປ
        
        }

        ///ຄຳນວນເວລາເຂົ້າງານເກິນເວລາ OT
        let calculateTimeOThour = 0;
        let calculateTimeOTMinute = 0;
        // Check if overtime conditions are met
        if (overTime >= 0 || overTimeMinute >= 30) {
          // Calculate pay for hours if overTime > 0
          if (overTime !== -1) {
            if (overTime > 0) {
              calculateTimeOThour = dataOThour * overTime;
            }
            // ເມື່ອເວລາເຂົ້າງານເກິນ 30 ນາທີ
            if (overTimeMinute >= 30) {
              calculateTimeOTMinute += dataOTminute;
            }
          } else {
            calculateTimeOThour = 0;
          }
        }
        let data = {
          emplyeecode: row.emplyeecode, // ตรวจสอบชื่อ Column ใน XLSX
          date: row?.date,
          fullName: row.fullName,
          inTime: inTimeJSDate, // ตรวจสอบชื่อ Column และ Format
          outTime: outTimeJSDate,
          lateTime: `${diffHours} ຊົ່ວໂມງ ${diffMinutes} ນາທີ `, //OT
          earlyTime: `${hours} ຊົ່ວໂມງ ${minutes} ນາທີ `, //มาช้า
          calculateTimeOThour: calculateTimeOThour,
          calculateTimeOTminute: calculateTimeOTMinute,
          calculateTimeLateHour: calculateTimeLate,
          calculateTimeLateMinute: calculateTimeLateMinute,
        };
      
        // ตัวอย่างการใช้งานกับข้อมูลของคุณ

        // คำนวณเวลามาสาย:
        const newInOutRecord = new InOut({
          HrAdminId: id,
          emplyeecode: data.emplyeecode,
          filtercheckIdcode: row.filtercheckIdcode,
          date: data?.date,
          fullName: data.fullName,
          inTime: data.inTime,
          outTime: data.outTime,
          lateTime: data.lateTime,
          earlyTime: data.earlyTime,
          calculateTimeOThour: data.calculateTimeOThour,
          calculateTimeOTminute: data.calculateTimeOTminute,
          calculateTimeLateHour: data.calculateTimeLateHour,
          calculateTimeLateMinute: data.calculateTimeLateMinute,
          incomeNet:
            calculateTimeOThour +
            calculateTimeOTMinute -
            (calculateTimeLate + calculateTimeLateMinute),
        });
        await newInOutRecord.save();
      } catch (error) {
        console.error("Error saving record:", error);
      }
    }

    // ลบไฟล์ที่อัปโหลดแล้ว
    fs.unlink(files.path, (err) => {
      if (err) console.error("Error deleting file:", err);
    });

    res.status(200).json({
      message: "ບັນທຶກສຳເລັດ",
    });
  } catch (err) {
    console.log(err);
  }
};

const getAllFileWork = async (req, res) => {
  try {
    const { id, role } = req;
    const data = await InOut.find({
      HrAdminId: id,
      
    });
    const dataEm = await dataEmployee.find({
      HrAdminId: id,
    });
    if (!dataEm || !data) {
      return res.status(404).json({ message: "ไม่พบข้อมูล" });
    }
    const dataOThour = dataEm[0]?.otTohour;
    const dataOTminute = dataEm[0]?.otminute;
    const dataLateTohour = dataEm[0]?.latTohour;
    const dataLateMinute = dataEm[0]?.latminute;
    const startWorkTime1 = dataEm[0]?.startWorkTime; //ເວລາເລີ່ມວຽກ
    const standardTimeWorkHour = dataEm[0]?.standardTimeWorkHour; //ເວລາເລີ່ມວຽກ
    let data1 = [];
    for (const row of data) {
      try {
        const Intime = row.inTime; //ເວລາຈາກ Excel  ເຂົ້າວຽກ
        const outTime = row.outTime; //ເວລາຈາກ Excel ເລີກວຽກ
        const startWorkTime = moment(startWorkTime1, "HH:mm:ss"); //ເວລາເລີ່ມວຽກ
        const endWorkTime = moment(Intime, "HH:mm:ss"); //ເວລາເຂົ້າວຽກ
        const d = moment.duration(endWorkTime.diff(startWorkTime)); // ຄຳນວນຫາໄລຍະຫາຂອງເວລາ
        const hours = d.hours(); // 1
        const minutes = d.minutes(); // 0
        let calculateTimeLate = 0;
        let calculateTimeLateMinute = 0;
        if (hours >= 1 || minutes >= 30) {
          if (hours >= 1) {
            calculateTimeLate = hours * dataLateTohour;
          }
          if (minutes >= 30) {
            calculateTimeLateMinute += dataLateMinute;
          }
        }

        ////ຄຳນວນເວລາເຂົ້າງານ OT
        const outTimeMoment = moment(outTime, "HH:mm:ss"); //ເລີກວຽກ
        // ຫາເວລາເຂົ້າງານ OT
        const timeDifferenceMs =
          outTimeMoment.valueOf() - startWorkTime.valueOf();
        // แปลง milliseconds เป็น Duration Object ของ Moment.js
        const duration = moment.duration(timeDifferenceMs);
        const diffHours = duration.hours(); //ຈຳນວນຊົ່ວໂມງ
        const diffMinutes = duration.minutes(); //ຈຳນວນນາທີ
        const diffSeconds = duration.seconds(); //ຈຳນວນວິນາທີ
        let overTime = 0; //ຄຳນວນຫາຊົ່ວໂມງເກີນ
        let overTimeMinute = 0; //ຄຳນວນຫານາທີເກີນ
        if (
          diffHours >= standardTimeWorkHour ||
          diffMinutes > 0 ||
          diffSeconds == 0
        ) {
          //ຖ້າເວລາເຂົ້າງານເກິນ 9 ຊົ່ວໂມງ ຫຼືເທົາ 9  ຖ້ານາທີຫລາຍກວ່າ 0
          overTime = diffHours - standardTimeWorkHour; //ຈຳນວນຊົ່ວໂມງ ລົບ ຈຳນວນທີ່ເຂົ້າງານ 9 ຊົ່ວໂມງ ຖ້າເກີນຄື ຊົ່ວໂມງ OT
          overTimeMinute = diffMinutes; //ເກບໄວ້ໃນຕົວແປ
            
        }

        // Calculate overtime pay
        let calculateTimeOThour = 0;
        let calculateTimeOTMinute = 0;

        // Check if overtime conditions are met
        if (overTime > 0 || overTimeMinute >= 30) {
          // Ensure overTime is not negative
          overTime = Math.max(0, overTime);

          // Calculate pay for overtime hours
          if (overTime > 0) {
            calculateTimeOThour = dataOThour * overTime;
       
          }

          // Calculate pay for overtime minutes if 30 minutes or more
          if (diffHours >= standardTimeWorkHour) {
            overTimeMinute >= 30 ? (calculateTimeOTMinute += dataOTminute) : 0;
          }
        }

        if (String(row?.date).includes("GMT")) {
          data1.push({
            id: row._id,
            filtercheckIdcode: row.filtercheckIdcode,
            emplyeecode: row.emplyeecode,
            date: row?.date,
            fullName: row.fullName,
            inTime: Intime,
            outTime: outTime,
            lateTime: `${diffHours}-${diffMinutes} `,
            earlyTime: `${hours == -1 ? 0 : hours}- ${minutes} `,
            durationOt: `${overTime <= 0 ? 0 : overTime}-${diffMinutes}`,
            calculateTimeOThour: calculateTimeOThour,
            calculateTimeOTminute: calculateTimeOTMinute,
            calculateTimeLateHour: calculateTimeLate,
            calculateTimeLateMinute: calculateTimeLateMinute,
            incomeNet:
              calculateTimeOThour +
              calculateTimeOTMinute -
              (calculateTimeLate + calculateTimeLateMinute),
          });
          await InOut.findOneAndUpdate(
            { _id: row._id },
            {
              HrAdminId: id,
             
              emplyeecode: row.emplyeecode,
              filtercheckIdcode: row.filtercheckIdcode,
              date: row?.date,
              fullName: row.fullName,
              inTime: Intime,
              outTime: outTime,
              lateTime: `${diffHours}-${diffMinutes} `,
              earlyTime: `${hours == -1 ? 0 : hours}- ${minutes} `,
              durationOt: `${overTime <= 0 ? 0 : overTime}-${diffMinutes}`,
              calculateTimeOThour: calculateTimeOThour,
              calculateTimeOTminute: calculateTimeOTMinute,
              calculateTimeLateHour: calculateTimeLate,
              calculateTimeLateMinute: calculateTimeLateMinute,
              incomeNet:
                calculateTimeOThour +
                calculateTimeOTMinute -
                (calculateTimeLate + calculateTimeLateMinute),
            },
            {
              new: true, // Return the updated document
            }
          );
        } else {
          const serialDate = Number(row?.date);
          const utc_day = Math.floor(serialDate - 25569);
          const utc_value = utc_day * 86400;
          const date_info = new Date(utc_value * 1000);
          const autDat = new Date(date_info);

          data1.push({
            id: row._id,
            filtercheckIdcode: row.filtercheckIdcode,
            emplyeecode: row.emplyeecode,
            date: autDat,
            fullName: row.fullName,
            inTime: Intime,
            outTime: outTime,
            lateTime: `${diffHours}-${diffMinutes} `,
            earlyTime: `${hours == -1 ? 0 : hours}- ${minutes} `,
            durationOt: `${overTime <= 0 ? 0 : overTime}-${diffMinutes}`,
            calculateTimeOThour: calculateTimeOThour,
            calculateTimeOTminute: calculateTimeOTMinute,
            calculateTimeLateHour: calculateTimeLate,
            calculateTimeLateMinute: calculateTimeLateMinute,
            incomeNet:
              calculateTimeOThour +
              calculateTimeOTMinute -
              (calculateTimeLate + calculateTimeLateMinute),
          });

          await InOut.findOneAndUpdate(
            { _id: row._id },
            {
              HrAdminId: id,
              emplyeecode: row.emplyeecode,
              filtercheckIdcode: row.filtercheckIdcode,
              date: autDat,
              fullName: row.fullName,
              inTime: Intime,
              outTime: outTime,
              lateTime: `${diffHours}-${diffMinutes} `,
              earlyTime: `${hours == -1 ? 0 : hours}- ${minutes} `,
              durationOt: `${overTime <= 0 ? 0 : overTime}-${diffMinutes}`,
              calculateTimeOThour: calculateTimeOThour,
              calculateTimeOTminute: calculateTimeOTMinute,
              calculateTimeLateHour: calculateTimeLate,
              calculateTimeLateMinute: calculateTimeLateMinute,
              incomeNet:
                calculateTimeOThour +
                calculateTimeOTMinute -
                (calculateTimeLate + calculateTimeLateMinute),
            },
            {
              new: true, // Return the updated document
            }
          );
        }
      } catch (error) {
        console.error("Error saving record:", error);
      }
    }
    // คำนวณเวลามาสาย:

    res.status(200).json({
      message: "ສຳເລັດ",
      data: data1,
    });
  } catch (err) {
    console.log(err);
  }
};

const addPassFormTimeOt = async (req, res) => {
  try {
    const {
      emplyeebarCode,
      fullName,
      filtercheckIdcode,
      date,
      inTime,
      outTime,
    } = req.body;
    const { id } = req;
    const findCheck = await InOut.find({
      HrAdminId: id,
    });
    const finded = findCheck.some(
      (item) =>
        item.filtercheckIdcode.toLowerCase() === filtercheckIdcode.toLowerCase()
    );

    if (finded) {
      res.status(400).json({
        message: "filtercheckIdcode ບໍ່ສາມາດມີໃນລະບົບຊໍ້າກັນໄດ້ ",
      });
      return;
    }
    const data = new InOut({
      HrAdminId: id,
      emplyeecode: emplyeebarCode,
      fullName,
      filtercheckIdcode,
      date,
      inTime,
      outTime,
    });
    await data.save();
    res.status(200).json({
      message: "ບັນທຶກສຳເລັດ",
    });
  } catch (err) {
    console.log(err);
  }
};
module.exports.addFileWork = addFileWork;
module.exports.getAllFileWork = getAllFileWork;
module.exports.addPassFormTimeOt = addPassFormTimeOt;
