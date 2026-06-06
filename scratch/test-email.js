const nodemailer = require("nodemailer");
const path = require("path");
const fs = require("fs");

// Load .env file manually
const envPath = path.join(__dirname, "..", ".env");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf8");
  const lines = content.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.substring(0, eqIdx).trim();
      let val = trimmed.substring(eqIdx + 1).trim();
      // remove surrounding quotes if any
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.substring(1, val.length - 1);
      }
      process.env[key] = val;
    }
  }
}

const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;

console.log("SMTP Config:", { smtpHost, smtpPort, smtpUser, smtpPass: smtpPass ? "***" : "missing" });

async function testEmail() {
  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: parseInt(smtpPort, 10),
    secure: parseInt(smtpPort, 10) === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  const mailOptions = {
    from: `"Webnova KPI Test" <${smtpUser}>`,
    to: smtpUser,
    subject: "SMTP Connection Test",
    text: "This is a diagnostic test email.",
  };

  try {
    console.log("Sending email...");
    const info = await transporter.sendMail(mailOptions);
    console.log("Success! Email sent. Response:", info.response);
  } catch (err) {
    console.error("Failed to send email. Error:", err);
  }
}

testEmail();
