/**
 * KHAN | Sniper Pro — Trial signup backend (Google Apps Script)
 * ---------------------------------------------------------------------------
 * HTML формоос ирсэн бүртгэлийг Google Sheet-д бичнэ.
 * Trial эхлэх = max(өнөөдөр, ACCESS_OPEN_ISO), дуусах = эхлэх + TRIAL_DAYS.
 *
 * Суурилуулах: KhanSniperPro_Signup_SETUP.md-г үзнэ үү.
 */

var TRIAL_DAYS = 7;
var SHEET_NAME = "Signups";

// Хандалт нээгдэх огноо (урьдчилсан бүртгэл). Энэ огнооноос ӨМНӨ бүртгүүлсэн
// хүмүүсийн trial энэ өдрөөс эхэлж тоологдоно (бүртгүүлсэн өдрөөс биш) —
// ингэснээр хүлээж байгаад trial хоног алдахгүй. Launch (2026-06-20) болсны
// дараа "" болгож болно — тэгвэл trial бүртгүүлсэн өдрөөсөө шууд эхэлнэ.
var ACCESS_OPEN_ISO = "2026-06-20";

// Сонголтот: шинэ бүртгэл ирэхэд өөрийн и-мэйл рүү мэдэгдэл явуулна.
// Хэрэггүй бол хоосон "" орхино.
var NOTIFY_EMAIL = "";

function doPost(e) {
  try {
    var lock = LockService.getScriptLock();
    lock.waitLock(20000); // зэрэг ирсэн бүртгэлүүд мөр давхцахаас сэргийлнэ

    var sheet = _getSheet();
    var p = (e && e.parameter) ? e.parameter : {};

    var now = new Date();
    var tz = Session.getScriptTimeZone();
    var fmt = "yyyy-MM-dd";

    // Trial эхлэх = max(өнөөдөр, хандалт нээгдэх огноо). Дуусах = эхлэх + 7 хоног.
    var trialStart = now;
    if (ACCESS_OPEN_ISO) {
      var openDate = new Date(ACCESS_OPEN_ISO + "T00:00:00");
      if (openDate.getTime() > now.getTime()) {
        trialStart = openDate;
      }
    }
    var trialEnd = new Date(trialStart.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

    sheet.appendRow([
      Utilities.formatDate(now, tz, "yyyy-MM-dd HH:mm"), // 1 Бүртгүүлсэн
      p.tvuser   || "",                                   // 2 TradingView username
      p.name     || "",                                   // 3 Нэр
      p.contact  || "",                                   // 4 Утас/Telegram
      p.email    || "",                                   // 5 И-мэйл
      p.asset    || "",                                   // 6 Ассет
      p.exp      || "",                                   // 7 Туршлага
      Utilities.formatDate(trialStart, tz, fmt),          // 8 Trial эхэлсэн (хандалт нээгдэх өдрөөс)
      Utilities.formatDate(trialEnd, tz, fmt),            // 9 Trial дуусах (+7 хоног)
      "Хүлээгдэж буй",                                    // 10 Хандалтын төлөв
      "Үгүй"                                              // 11 Төлсөн эсэх
    ]);

    if (NOTIFY_EMAIL) {
      MailApp.sendEmail(
        NOTIFY_EMAIL,
        "🟢 Шинэ trial бүртгэл: " + (p.tvuser || "?"),
        "TradingView: " + (p.tvuser || "") +
        "\nНэр: " + (p.name || "") +
        "\nХолбоо: " + (p.contact || "") +
        "\nАссет: " + (p.asset || "") +
        "\nTrial дуусах: " + Utilities.formatDate(trialEnd, tz, fmt)
      );
    }

    lock.releaseLock();
    return _json({ ok: true });
  } catch (err) {
    return _json({ ok: false, error: String(err) });
  }
}

// Хүснэгт байхгүй бол header-тэйгээр шинээр үүсгэнэ.
function _getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow([
      "Бүртгүүлсэн", "TV username", "Нэр", "Утас/Telegram", "И-мэйл",
      "Ассет", "Туршлага", "Trial эхэлсэн", "Trial дуусах",
      "Хандалтын төлөв", "Төлсөн эсэх"
    ]);
    sheet.getRange(1, 1, 1, 11).setFontWeight("bold").setBackground("#151a21").setFontColor("#ffffff");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function _json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// Хөтөч дээр Web App URL-ийг шалгахад "running" гэж харуулна.
function doGet() {
  return ContentService.createTextOutput("KHAN Sniper Pro signup endpoint is running.");
}
