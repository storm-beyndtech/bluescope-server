export function emailTemplate(bodyContent) {
	return `
      <table role="presentation" width="100%" bgcolor="#f9f9f9" style="padding: 20px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" max-width="600px" bgcolor="#ffffff" style="border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
            <tr>
              <td align="center" style="padding: 20px; background: #13160F;">
                <img src="https://res.cloudinary.com/ddb1vjioq/image/upload/v1747418188/copyelite-logo_fbffky.png" width="120" alt="Company Logo" style="display: block;">
              </td>
            </tr>

            <!-- Body Content -->
            <tr>
                ${bodyContent}
            </tr>
            <!-- Footer -->
            <tr>
              <td align="center" style="padding: 20px; background: #13160F; color: #fafafa; font-size: 12px;">
                © 2025 Copyelite | All Rights Reserved
              </td>
            </tr>
          </table>
  `;
}
