// Express 4 ไม่ catch promise rejection ใน async handler ให้อัตโนมัติ
// (ต่างจาก Express 5) — ห่อด้วยฟังก์ชันนี้เพื่อไม่ให้ request ค้างเงียบๆ ถ้า query พัง
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((err) => {
      console.error(err);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในระบบ' });
      }
    });
  };
}

module.exports = asyncHandler;
