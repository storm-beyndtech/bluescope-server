import dotenv from "dotenv";
dotenv.config();
import { transporter } from "./emailConfig.js";
import { emailTemplate } from "./emailTemplate.js";

const sendMail = (mailData) => {
	return new Promise((resolve, reject) => {
		transporter.sendMail(mailData, (err, info) => {
			if (err) {
				console.error(err);
				reject(err);
			} else {
				console.log(info);
				resolve(info);
			}
		});
	});
};

const sendMailWithRetry = async (mailData, retries = 3) => {
	for (let i = 0; i < retries; i++) {
		try {
			return await sendMail(mailData);
		} catch (error) {
			if (i === retries - 1) throw error;
			console.log(`Retrying sendMail... Attempt ${i + 1}`);
		}
	}
};

// Welcome mail (KYC Approved)
export async function welcomeMail(userEmail, fullName = "Valued Customer") {
	try {
		let bodyContent = `
      <td style="padding: 20px; line-height: 1.8;">
        <p>Dear ${fullName},</p>
        <p>Welcome Aboard to Bluevestapty Club!</p>
        <p>
          We're thrilled to have you as part of our community. Your KYC has been approved
          and you can now enjoy all our services and features.
        </p>
        <p>
          If you have questions or need assistance, reach out 
          to our support team at support@bluevestapty.club.
        </p>
        <p>Best regards</p>
        <p>The Bluevestapty Team</p>
      </td>
    `;

		let mailOptions = {
			from: `Bluevestapty ${process.env.SMTP_USER}`,
			to: userEmail,
			subject: "Welcome Aboard to Bluevestapty Club",
			html: emailTemplate(bodyContent),
		};

		const result = await sendMailWithRetry(mailOptions);
		return result;
	} catch (error) {
		return { error: error instanceof Error && error.message };
	}
}

// Email verification
export async function verificationMail(userEmail, verificationLink) {
	try {
		let bodyContent = `
      <td style="padding: 20px; line-height: 1.8;">
        <p>Please verify your email address</p>
        <p>
          Click the link below to verify your email address and complete your registration:
        </p>
        <a href="${verificationLink}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">
          Verify Email Address
        </a>
        <p>
          If the button doesn't work, copy and paste this link into your browser:
          <br>${verificationLink}
        </p>
        <p>
          If you have questions or need assistance, reach out 
          to our support team at support@bluevestapty.club.
        </p>
        <p>Best regards</p>
        <p>The Bluevestapty Team</p>
      </td>
    `;

		let mailOptions = {
			from: `Bluevestapty ${process.env.SMTP_USER}`,
			to: userEmail,
			subject: "Please verify your email address",
			html: emailTemplate(bodyContent),
		};

		const result = await sendMailWithRetry(mailOptions);
		return result;
	} catch (error) {
		return { error: error instanceof Error && error.message };
	}
}

// OTP mail
export async function otpMail(userEmail, otp) {
	try {
		let bodyContent = `
      <td style="padding: 20px; line-height: 1.8;">
        <p>Your Verification code is:</p>
        <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; border-radius: 5px; margin: 20px 0;">
          ${otp}
        </div>
        <p>
          Copy and paste the above code into the form on the 
          website to continue. This code expires in 5 minutes.
        </p>
        <p>
          If you have questions or need assistance, reach out 
          to our support team at support@bluevestapty.club.
        </p>
        <p>Best regards</p>
        <p>The Bluevestapty Team</p>
      </td>
    `;

		let mailOptions = {
			from: `Bluevestapty ${process.env.SMTP_USER}`,
			to: userEmail,
			subject: "Your Verification Code",
			html: emailTemplate(bodyContent),
		};

		const result = await sendMailWithRetry(mailOptions);
		return result;
	} catch (error) {
		return { error: error instanceof Error && error.message };
	}
}

// Password reset code
export async function passwordResetCode(userEmail, resetCode) {
	try {
		let bodyContent = `
      <td style="padding: 20px; line-height: 1.8;">
        <p>Password Reset</p>
        <p>
          A request was sent for password reset. Use the code below to reset your password:
        </p>
        <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; border-radius: 5px; margin: 20px 0;">
          ${resetCode}
        </div>
        <p>
          If you didn't request this, please contact our customer service immediately.
        </p>
        <p>
          If you have questions or need assistance, reach out 
          to our support team at support@bluevestapty.club.
        </p>
        <p>Best regards</p>
        <p>The Bluevestapty Team</p>
      </td>
    `;

		let mailOptions = {
			from: `Bluevestapty ${process.env.SMTP_USER}`,
			to: userEmail,
			subject: "Password Reset",
			html: emailTemplate(bodyContent),
		};

		const result = await sendMailWithRetry(mailOptions);
		return result;
	} catch (error) {
		return { error: error instanceof Error && error.message };
	}
}

// Password reset confirmation
export async function passwordResetConfirmation(userEmail, fullName = "Valued Customer") {
	try {
		let bodyContent = `
      <td style="padding: 20px; line-height: 1.8;">
        <p>Dear ${fullName},</p>
        <p>You have reset your password</p>
        <p>
          Your password has been successfully reset. You can now log in with your new password.
        </p>
        <p>
          If you didn't make this change, please contact our support team immediately.
        </p>
        <p>
          If you have questions or need assistance, reach out 
          to our support team at support@bluevestapty.club.
        </p>
        <p>Best regards</p>
        <p>The Bluevestapty Team</p>
      </td>
    `;

		let mailOptions = {
			from: `Bluevestapty ${process.env.SMTP_USER}`,
			to: userEmail,
			subject: "Password Reset Confirmation",
			html: emailTemplate(bodyContent),
		};

		const result = await sendMailWithRetry(mailOptions);
		return result;
	} catch (error) {
		return { error: error instanceof Error && error.message };
	}
}

// KYC Request Submitted
export async function kycRequested(userEmail, fullName = "Valued Customer") {
	try {
		let bodyContent = `
      <td style="padding: 20px; line-height: 1.8;">
        <p>Dear ${fullName},</p>
        <p>KYC Request Submitted Successfully</p>
        <p>
          Your KYC verification documents have been submitted successfully. 
          We will review your documents and notify you of the status within 24-48 hours.
        </p>
        <p>
          You can check your verification status in your account dashboard.
        </p>
        <p>
          If you have questions or need assistance, reach out 
          to our support team at support@bluevestapty.club.
        </p>
        <p>Best regards</p>
        <p>The Bluevestapty Team</p>
      </td>
    `;

		let mailOptions = {
			from: `Bluevestapty ${process.env.SMTP_USER}`,
			to: userEmail,
			subject: "KYC Request Submitted Successfully",
			html: emailTemplate(bodyContent),
		};

		const result = await sendMailWithRetry(mailOptions);
		return result;
	} catch (error) {
		return { error: error instanceof Error && error.message };
	}
}

// KYC Rejected
export async function kycRejected(userEmail, fullName = "Valued Customer") {
	try {
		let bodyContent = `
      <td style="padding: 20px; line-height: 1.8;">
        <p>Dear ${fullName},</p>
        <p>KYC has been rejected</p>
        <p>
          Unfortunately, your KYC verification has been rejected. 
          Please review your submitted documents and try again.
        </p>
        <p>
          You can resubmit your documents through your account dashboard.
        </p>
        <p>
          If you have questions or need assistance, reach out 
          to our support team at support@bluevestapty.club.
        </p>
        <p>Best regards</p>
        <p>The Bluevestapty Team</p>
      </td>
    `;

		let mailOptions = {
			from: `Bluevestapty ${process.env.SMTP_USER}`,
			to: userEmail,
			subject: "KYC Rejected Successfully",
			html: emailTemplate(bodyContent),
		};

		const result = await sendMailWithRetry(mailOptions);
		return result;
	} catch (error) {
		return { error: error instanceof Error && error.message };
	}
}

// Balance credited
export async function balanceCredited(userEmail, fullName, amount, date) {
	try {
		let bodyContent = `
      <td style="padding: 20px; line-height: 1.8;">
        <p>Dear ${fullName},</p>
        <p>Your Account has been Credited</p>
        <p>
          Your account has been credited with <strong>${amount}</strong> on ${date}.
        </p>
        <p>
          If you have questions or need assistance, reach out 
          to our support team at support@bluevestapty.club.
        </p>
        <p>Best regards</p>
        <p>The Bluevestapty Team</p>
      </td>
    `;

		let mailOptions = {
			from: `Bluevestapty ${process.env.SMTP_USER}`,
			to: userEmail,
			subject: "Your Account has been Credited",
			html: emailTemplate(bodyContent),
		};

		const result = await sendMailWithRetry(mailOptions);
		return result;
	} catch (error) {
		return { error: error instanceof Error && error.message };
	}
}

// Balance debited
export async function balanceDebited(userEmail, fullName, amount, date) {
	try {
		let bodyContent = `
      <td style="padding: 20px; line-height: 1.8;">
        <p>Dear ${fullName},</p>
        <p>Your Account has been Debited</p>
        <p>
          Your account has been debited with <strong>${amount}</strong> on ${date}.
        </p>
        <p>
          If you have questions or need assistance, reach out 
          to our support team at support@bluevestapty.club.
        </p>
        <p>Best regards</p>
        <p>The Bluevestapty Team</p>
      </td>
    `;

		let mailOptions = {
			from: `Bluevestapty ${process.env.SMTP_USER}`,
			to: userEmail,
			subject: "Your Account has been Debited",
			html: emailTemplate(bodyContent),
		};

		const result = await sendMailWithRetry(mailOptions);
		return result;
	} catch (error) {
		return { error: error instanceof Error && error.message };
	}
}

// Deposit requested
export async function depositRequested(userEmail, fullName, amount, date) {
	try {
		let bodyContent = `
      <td style="padding: 20px; line-height: 1.8;">
        <p>Dear ${fullName},</p>
        <p>Deposit Request Submitted Successfully</p>
        <p>
          Your deposit request of <strong>${amount}</strong> has been submitted successfully on ${date}.
          We will process your request shortly.
        </p>
        <p>
          If you have questions or need assistance, reach out 
          to our support team at support@bluevestapty.club.
        </p>
        <p>Best regards</p>
        <p>The Bluevestapty Team</p>
      </td>
    `;

		let mailOptions = {
			from: `Bluevestapty ${process.env.SMTP_USER}`,
			to: userEmail,
			subject: "Deposit Request Submitted Successfully",
			html: emailTemplate(bodyContent),
		};

		const result = await sendMailWithRetry(mailOptions);
		return result;
	} catch (error) {
		return { error: error instanceof Error && error.message };
	}
}

// Deposit status (approved/rejected)
export async function depositStatus(userEmail, fullName, amount, date, success) {
	try {
		let bodyContent, subject;

		if (success) {
			subject = "Your Deposit is Approved";
			bodyContent = `
        <td style="padding: 20px; line-height: 1.8;">
          <p>Dear ${fullName},</p>
          <p>Your Deposit is Approved</p>
          <p>
            Your deposit of <strong>${amount}</strong> has been approved and processed on ${date}.
            You can now use your funds to trade on Bluevestapty.
          </p>
          <p>
            If you have questions or need assistance, reach out 
            to our support team at support@bluevestapty.club.
          </p>
          <p>Best regards</p>
          <p>The Bluevestapty Team</p>
        </td>
      `;
		} else {
			subject = "Your Deposit Request is Rejected";
			bodyContent = `
        <td style="padding: 20px; line-height: 1.8;">
          <p>Dear ${fullName},</p>
          <p>Your Deposit Request is Rejected</p>
          <p>
            Your deposit request of <strong>${amount}</strong> submitted on ${date} has been rejected.
          </p>
          <p>
            Please contact our support team for more information.
          </p>
          <p>
            If you have questions or need assistance, reach out 
            to our support team at support@bluevestapty.club.
          </p>
          <p>Best regards</p>
          <p>The Bluevestapty Team</p>
        </td>
      `;
		}

		let mailOptions = {
			from: `Bluevestapty ${process.env.SMTP_USER}`,
			to: userEmail,
			subject: subject,
			html: emailTemplate(bodyContent),
		};

		const result = await sendMailWithRetry(mailOptions);
		return result;
	} catch (error) {
		return { error: error instanceof Error && error.message };
	}
}

// Withdraw requested
export async function withdrawRequested(userEmail, fullName, amount, date) {
	try {
		let bodyContent = `
      <td style="padding: 20px; line-height: 1.8;">
        <p>Dear ${fullName},</p>
        <p>Withdraw Request Submitted Successfully</p>
        <p>
          Your withdrawal request of <strong>${amount}</strong> has been submitted successfully on ${date}.
          We will process your request shortly.
        </p>
        <p>
          If you have questions or need assistance, reach out 
          to our support team at support@bluevestapty.club.
        </p>
        <p>Best regards</p>
        <p>The Bluevestapty Team</p>
      </td>
    `;

		let mailOptions = {
			from: `Bluevestapty ${process.env.SMTP_USER}`,
			to: userEmail,
			subject: "Withdraw Request Submitted Successfully",
			html: emailTemplate(bodyContent),
		};

		const result = await sendMailWithRetry(mailOptions);
		return result;
	} catch (error) {
		return { error: error instanceof Error && error.message };
	}
}

// Withdraw status (approved/rejected)
export async function withdrawStatus(userEmail, fullName, amount, date, success) {
	try {
		let bodyContent, subject;

		if (success) {
			subject = "Withdraw Request has been Processed and your money is sent";
			bodyContent = `
        <td style="padding: 20px; line-height: 1.8;">
          <p>Dear ${fullName},</p>
          <p>Withdraw Request has been Processed and your money is sent</p>
          <p>
            Your withdrawal of <strong>${amount}</strong> has been processed successfully on ${date}.
            The funds have been sent to your designated account.
          </p>
          <p>
            If you have questions or need assistance, reach out 
            to our support team at support@bluevestapty.club.
          </p>
          <p>Best regards</p>
          <p>The Bluevestapty Team</p>
        </td>
      `;
		} else {
			subject = "Withdraw Request has been Rejected and your money is refunded to your account";
			bodyContent = `
        <td style="padding: 20px; line-height: 1.8;">
          <p>Dear ${fullName},</p>
          <p>Withdraw Request has been Rejected and your money is refunded to your account</p>
          <p>
            Your withdrawal request of <strong>${amount}</strong> submitted on ${date} has been rejected.
            The funds have been refunded to your account.
          </p>
          <p>
            Please contact our support team for more information.
          </p>
          <p>
            If you have questions or need assistance, reach out 
            to our support team at support@bluevestapty.club.
          </p>
          <p>Best regards</p>
          <p>The Bluevestapty Team</p>
        </td>
      `;
		}

		let mailOptions = {
			from: `Bluevestapty ${process.env.SMTP_USER}`,
			to: userEmail,
			subject: subject,
			html: emailTemplate(bodyContent),
		};

		const result = await sendMailWithRetry(mailOptions);
		return result;
	} catch (error) {
		return { error: error instanceof Error && error.message };
	}
}

// Interest added
export async function interestAdded(userEmail, fullName, amount, date) {
	try {
		let bodyContent = `
      <td style="padding: 20px; line-height: 1.8;">
        <p>Dear ${fullName},</p>
        <p>Interest added to your balance</p>
        <p>
          Interest of <strong>${amount}</strong> has been added to your balance on ${date}.
        </p>
        <p>
          If you have questions or need assistance, reach out 
          to our support team at support@bluevestapty.club.
        </p>
        <p>Best regards</p>
        <p>The Bluevestapty Team</p>
      </td>
    `;

		let mailOptions = {
			from: `Bluevestapty ${process.env.SMTP_USER}`,
			to: userEmail,
			subject: "Interest added to your balance",
			html: emailTemplate(bodyContent),
		};

		const result = await sendMailWithRetry(mailOptions);
		return result;
	} catch (error) {
		return { error: error instanceof Error && error.message };
	}
}

// Investment requested (pending)
export async function investmentRequested(userEmail, fullName, amount, date, investmentType = "") {
  try {
    let bodyContent = `
      <td style="padding: 20px; line-height: 1.8;">
        <p>Dear ${fullName},</p>
        <p>Investment Request Submitted Successfully</p>
        <p>
          Your investment request${investmentType ? ` for ${investmentType}` : ''} of <strong>${amount}</strong> 
          has been submitted successfully on ${date}. We will process your request shortly.
        </p>
        <p>
          You can track your investment status in your account dashboard.
        </p>
        <p>
          If you have questions or need assistance, reach out 
          to our support team at support@bluevestapty.club.
        </p>
        <p>Best regards</p>
        <p>The Bluevestapty Team</p>
      </td>
    `;

    let mailOptions = {
      from: `Bluevestapty ${process.env.SMTP_USER}`,
      to: userEmail,
      subject: "Investment Request Submitted Successfully",
      html: emailTemplate(bodyContent),
    };

    const result = await sendMailWithRetry(mailOptions);
    return result;
  } catch (error) {
    return { error: error instanceof Error && error.message };
  }
}

// Investment completed
export async function investmentCompleted(userEmail, fullName, amount, date, investmentType = "") {
	try {
		let bodyContent = `
      <td style="padding: 20px; line-height: 1.8;">
        <p>Dear ${fullName},</p>
        <p>Investment successfully completed</p>
        <p>
          Your investment${investmentType ? ` in ${investmentType}` : ""} of <strong>${amount}</strong> 
          has been successfully completed on ${date}.
        </p>
        <p>
          If you have questions or need assistance, reach out 
          to our support team at support@bluevestapty.club.
        </p>
        <p>Best regards</p>
        <p>The Bluevestapty Team</p>
      </td>
    `;

		let mailOptions = {
			from: `Bluevestapty ${process.env.SMTP_USER}`,
			to: userEmail,
			subject: "Investment successfully completed",
			html: emailTemplate(bodyContent),
		};

		const result = await sendMailWithRetry(mailOptions);
		return result;
	} catch (error) {
		return { error: error instanceof Error && error.message };
	}
}

// Investment approved
export async function investmentApproved(userEmail, fullName, amount, date, investmentType = "") {
	try {
		let bodyContent = `
      <td style="padding: 20px; line-height: 1.8;">
        <p>Dear ${fullName},</p>
        <p>Investment Approved</p>
        <p>
          Your investment${investmentType ? ` in ${investmentType}` : ''} of <strong>${amount}</strong> 
          has been approved on ${date}. Your investment is now active and earning returns.
        </p>
        <p>
          You can monitor your investment performance in your account dashboard.
        </p>
        <p>
          If you have questions or need assistance, reach out 
          to our support team at support@bluevestapty.club.
        </p>
        <p>Best regards</p>
        <p>The Bluevestapty Team</p>
      </td>
    `;

		let mailOptions = {
			from: `Bluevestapty ${process.env.SMTP_USER}`,
			to: userEmail,
			subject: "Investment Approved",
			html: emailTemplate(bodyContent),
		};

		const result = await sendMailWithRetry(mailOptions);
		return result;
	} catch (error) {
		return { error: error instanceof Error && error.message };
	}
}

// Investment rejected
export async function investmentRejected(userEmail, fullName, amount, date, investmentType = "") {
	try {
		let bodyContent = `
      <td style="padding: 20px; line-height: 1.8;">
        <p>Dear ${fullName},</p>
        <p>Investment Request Rejected</p>
        <p>
          Your investment request${investmentType ? ` for ${investmentType}` : ''} of <strong>${amount}</strong> 
          submitted on ${date} has been rejected. The funds have been refunded to your account.
        </p>
        <p>
          Please contact our support team for more information.
        </p>
        <p>
          If you have questions or need assistance, reach out 
          to our support team at support@bluevestapty.club.
        </p>
        <p>Best regards</p>
        <p>The Bluevestapty Team</p>
      </td>
    `;

		let mailOptions = {
			from: `Bluevestapty ${process.env.SMTP_USER}`,
			to: userEmail,
			subject: "Investment Request Rejected",
			html: emailTemplate(bodyContent),
		};

		const result = await sendMailWithRetry(mailOptions);
		return result;
	} catch (error) {
		return { error: error instanceof Error && error.message };
	}
}


// Referral commission
export async function referralCommission(userEmail, fullName, amount, date, referredName = "") {
	try {
		let bodyContent = `
      <td style="padding: 20px; line-height: 1.8;">
        <p>Dear ${fullName},</p>
        <p>Referral Commission</p>
        <p>
          You have earned a referral commission of <strong>${amount}</strong> on ${date}.
          ${referredName ? `Thank you for referring ${referredName}!` : "Thank you for your referral!"}
        </p>
        <p>
          If you have questions or need assistance, reach out 
          to our support team at support@bluevestapty.club.
        </p>
        <p>Best regards</p>
        <p>The Bluevestapty Team</p>
      </td>
    `;

		let mailOptions = {
			from: `Bluevestapty ${process.env.SMTP_USER}`,
			to: userEmail,
			subject: "Referral Commission",
			html: emailTemplate(bodyContent),
		};

		const result = await sendMailWithRetry(mailOptions);
		return result;
	} catch (error) {
		return { error: error instanceof Error && error.message };
	}
}

// Referral join
export async function referralJoin(userEmail, fullName, refName, date) {
	try {
		let bodyContent = `
      <td style="padding: 20px; line-height: 1.8;">
        <p>Dear ${fullName},</p>
        <p>
          ${refName} has successfully joined through your referral on ${date}.
        </p>
        <p>Best regards</p>
        <p>The Bluevestapty Team</p>
      </td>
    `;

		let mailOptions = {
			from: `Bluevestapty ${process.env.SMTP_USER}`,
			to: userEmail,
			subject: "Referral Join",
			html: emailTemplate(bodyContent),
		};

		const result = await sendMailWithRetry(mailOptions);
		return result;
	} catch (error) {
		return { error: error instanceof Error && error.message };
	}
}

// Alert Admin
export async function alertAdmin(email, amount, date, type) {
	try {
		let bodyContent = `
      <td style="padding: 20px; line-height: 1.8;">
        <p>
            A ${type} request of $${amount} was initiated 
            by a user with this email: ${email}, date: ${date}
        </p>
      </td>
    `;

		let mailOptions = {
			from: `Bluevestapty ${process.env.SMTP_USER}`,
			to: process.env.SMTP_USER,
			subject: "Admin Alert!",
			html: emailTemplate(bodyContent),
		};

		const result = await sendMailWithRetry(mailOptions);
		return result;
	} catch (error) {
		return { error: error instanceof Error && error.message };
	}
}

// Multi emails (bulk email)
export async function multiMails(emails, subject, message) {
	try {
		let bodyContent = `
      <td style="padding: 20px; line-height: 1.8;">
        <p>
          ${message}
        </p>
        <p>
          If you have questions or need assistance, reach out 
          to our support team at support@bluevestapty.club.
        </p>
        <p>Best regards</p>
        <p>The Bluevestapty Team</p>
      </td>
    `;

		let mailOptions = {
			from: `Bluevestapty ${process.env.SMTP_USER}`,
			to: emails,
			subject: subject,
			html: emailTemplate(bodyContent),
		};

		const result = await sendMailWithRetry(mailOptions);
		return result;
	} catch (error) {
		return { error: error instanceof Error && error.message };
	}
}
