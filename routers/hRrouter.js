const express = require("express");
const multer = require("multer");
const {
  addDataEmployee,
  getAllDataEmployee,
  getOneIdDataEmployee,
  editdatabase,
  edit_deparmentPosition,
  deletedatabasetypeSecurity,
  deletedatabaseholidays,
  getDepartment,
} = require("../controllers/InformationEmplyee");
const {
  createEmployee,
  getIdEmlyries,
  editEmployee,
} = require("../controllers/HR/formEmplyee");
const hrrouter = express.Router();
const {
  debugRequest,
  handleMulterError,
  upload,
} = require("../middleware/upload");
const {
  addFileWork,
  getAllFileWork,
  addPassFormTimeOt,
} = require("../controllers/HR/providerTimework");
const {
  addDataSalary,
  getAllDataSalary,
  saveTax,
  getTax,
  editTax,
  deleteTax,
  cardForSummary,
  postsavepaySalary,
  getSalary,
  CancelCardSummary,
  addFormDataEdit,
  deletesalary,
} = require("../controllers/HR/AllForSalaryFuntion");
const { authMiddlewares } = require("../middleware/authmiddleware");
const {
  saveLeave,
  getLeave,
  statusAllow,
  getLeaveId,
} = require("../controllers/HR/hr");
const {
  addBenefit,
  getAllBenefits,
  getBenifitsId,
  editBenefit,
  deleteBenefit,
  addBennifitEmplyee,
} = require("../controllers/HR/Benifits");

hrrouter.get("/dataEM", authMiddlewares, getAllDataEmployee);
hrrouter.get("/editdatabase/:id", getOneIdDataEmployee);
//อับเดดຖານຂໍ້ມູນ
hrrouter.post("/edit_data/:id", editdatabase);
hrrouter.post("/addDataEmplyee", authMiddlewares, addDataEmployee);
hrrouter.delete(
  "/settings/:settingId/typeOfSecurity/:index",
  authMiddlewares,
  deletedatabasetypeSecurity
);
hrrouter.delete(
  "/settings/:settingId/deletedatabaseholidays/:index",
  authMiddlewares,
  deletedatabaseholidays
);

//edit deparment position hr
hrrouter.post("/edit_deparmentPosition/:id", edit_deparmentPosition);
// สร้างพนักงานใหม่
hrrouter.post(
  "/registerEmplyee",
  authMiddlewares,
  debugRequest,
  upload.fields([
    { name: "personalInfo[profileImage]", maxCount: 1 },
    { name: "personalInfo[idCardImage]", maxCount: 1 },
    { name: "employmentInfo[contractFile]", maxCount: 1 },
    { name: "educationHistory[0][certificate]", maxCount: 1 },
    { name: "educationHistory[1][certificate]", maxCount: 1 },
    { name: "educationHistory[2][certificate]", maxCount: 1 },
    { name: "workExperience[0][referenceFile]", maxCount: 1 },
    { name: "workExperience[1][referenceFile]", maxCount: 1 },
    { name: "workExperience[2][referenceFile]", maxCount: 1 },
  ]),
  handleMulterError,
  createEmployee
);
hrrouter.get("/getIdEmlyee/:id", authMiddlewares, getIdEmlyries);
hrrouter.patch(
  "/editEmployee/:id",
  authMiddlewares,
  debugRequest,
  upload.fields([
    { name: "personalInfo[profileImage]", maxCount: 1 },
    { name: "personalInfo[idCardImage]", maxCount: 1 },
    { name: "employmentInfo[contractFile]", maxCount: 1 },
    { name: "educationHistory[0][certificate]", maxCount: 1 },
    { name: "educationHistory[1][certificate]", maxCount: 1 },
    { name: "educationHistory[2][certificate]", maxCount: 1 },
    { name: "workExperience[0][referenceFile]", maxCount: 1 },
    { name: "workExperience[1][referenceFile]", maxCount: 1 },
    { name: "workExperience[2][referenceFile]", maxCount: 1 },
  ]),
  handleMulterError,
  editEmployee
);
//add In-out
hrrouter.post("/InAndout", upload.single("file"), authMiddlewares, addFileWork);
hrrouter.get("/getAllot", authMiddlewares, getAllFileWork);
hrrouter.post("/addFormData", authMiddlewares, addPassFormTimeOt);
hrrouter.patch("/addFormDataEdit/:id", authMiddlewares, addFormDataEdit);

hrrouter.post("/addDataAlreadySalary", authMiddlewares, addDataSalary);
hrrouter.get("/getAllDataSalary", authMiddlewares, getAllDataSalary);
///saveTax
hrrouter.post("/saveTax", authMiddlewares, saveTax);
hrrouter.get("/getTax", authMiddlewares, getTax);
hrrouter.post("/editTax", editTax);
hrrouter.delete("/deleteTax/:id", deleteTax);

///cardSummry
hrrouter.get("/cardsummary", authMiddlewares, cardForSummary);
hrrouter.delete("/CancelCardSummary/:id", CancelCardSummary);
///postsavesalary
hrrouter.post("/receiptsalary", authMiddlewares, postsavepaySalary);
hrrouter.get("/getSalary", authMiddlewares, getSalary);
hrrouter.delete("/deletesalarycalu/:id", authMiddlewares, deletesalary);

///leave
hrrouter.post("/saveLeave", saveLeave);
hrrouter.get("/getLeave", authMiddlewares, getLeave);
hrrouter.post("/statusAllow/:leaveId", authMiddlewares, statusAllow);
hrrouter.get("/getLeaveId/:idOne", authMiddlewares, getLeaveId);
//department

hrrouter.get("/getDepartment", authMiddlewares, getDepartment);

//benefits
hrrouter.post(
  "/benifits",
  authMiddlewares,
  upload.single("attachedDocument"),
  addBenefit
);
hrrouter.get("/getBenifits", authMiddlewares, getAllBenefits);
hrrouter.get("/getBenifitsId/:id", authMiddlewares, getBenifitsId);
hrrouter.patch(
  "/editBenefit/:id",
  upload.single("attachedDocument"),
  authMiddlewares,
  editBenefit
);
hrrouter.delete("/deleteBenefit/:id", authMiddlewares, deleteBenefit);
hrrouter.post("/addBenifitEmplyee", authMiddlewares, addBennifitEmplyee);
module.exports = hrrouter;
