export const emailTemplates = {
  adoptionConfirmation: (data: {
    firstName: string;
    lastName: string;
    petName: string;
    petSpecies: string;
    confirmUrl: string;
    cancelUrl: string;
    expiresIn: string;
  }) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body>
      <div style="font-family: Arial, sans-serif; background: #f5f7fa; padding: 24px;">
        <table align="center" cellpadding="0" cellspacing="0" width="100%" 
               style="max-width: 600px; background: #ffffff; border-radius: 12px; padding: 24px;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom: 20px;">
              <img src="https://res.cloudinary.com/drujd0cbj/image/upload/v1762537915/logo_hktthj.png"
                   alt="App Logo"
                   style="max-width: 90%; height: auto;" />
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td align="center" style="font-size: 22px; color: #333; font-weight: bold; padding-bottom: 12px;">
              Yêu cầu xác nhận nhận nuôi
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="font-size: 15px; color: #444; line-height: 1.6;">
              Kính gửi <strong>${data.firstName} ${data.lastName}</strong>,
            </td>
          </tr>

          <!-- Message -->
          <tr>
            <td style="font-size: 15px; color: #444; line-height: 1.6; padding-top: 14px;">
              Cảm ơn bạn đã quan tâm đến việc nhận nuôi
              <strong>${data.petName}</strong> (${data.petSpecies})!
              Để tiếp tục, vui lòng xác nhận yêu cầu nhận nuôi của bạn trong vòng
              <strong>${data.expiresIn}</strong>.
            </td>
          </tr>

          <!-- Confirm Button -->
          <tr>
            <td align="center" style="padding-top: 26px;">
              <a href="${data.confirmUrl}"
                 style="background: #4CAF50; color: #ffffff; text-decoration: none;
                        padding: 14px 32px; font-size: 15px; border-radius: 6px; font-weight: bold; display: inline-block;">
                Xác nhận nhận nuôi
              </a>
            </td>
          </tr>

          <!-- Cancel Text -->
          <tr>
            <td style="font-size: 15px; color: #444; line-height: 1.6; padding-top: 24px;">
              Nếu bạn đã thay đổi ý định, bạn có thể hủy yêu cầu của mình:
            </td>
          </tr>

          <!-- Cancel Button -->
          <tr>
            <td align="center" style="padding-top: 16px;">
              <a href="${data.cancelUrl}"
                 style="background: #f44336; color: #ffffff; text-decoration: none;
                        padding: 14px 32px; font-size: 15px; border-radius: 6px; font-weight: bold; display: inline-block;">
                Hủy yêu cầu
              </a>
            </td>
          </tr>

          <!-- Safely Ignore -->
          <tr>
            <td style="font-size: 14px; color: #555; line-height: 1.5; padding-top: 28px;">
              Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="font-size: 13px; color: #888; padding-top: 35px;">
              🐾 Cảm ơn bạn đã cho thú cưng một cơ hội thứ hai. <br/><br/>
              <strong>Đội ngũ Second Chance Sanctuary</strong>
            </td>
          </tr>

        </table>
      </div>
    </body>
    </html>
  `,

  adoptionStatusUpdate: (data: {
    firstName: string;
    lastName: string;
    petName: string;
    status: string;
    message: string;
    detailsUrl: string;
  }) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body>
      <div style="font-family: Arial, sans-serif; background: #f5f7fa; padding: 24px;">
        <table align="center" cellpadding="0" cellspacing="0" width="100%" 
               style="max-width: 600px; background: #ffffff; border-radius: 12px; padding: 24px;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom: 20px;">
              <img src="https://res.cloudinary.com/drujd0cbj/image/upload/v1762537915/logo_hktthj.png"
                   alt="App Logo"
                   style="max-width: 90%; height: auto;" />
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td align="center" style="font-size: 22px; color: #333; font-weight: bold; padding-bottom: 12px;">
              Cập nhật trạng thái nhận nuôi
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="font-size: 15px; color: #444; line-height: 1.6;">
              Kính gửi <strong>${data.firstName} ${data.lastName}</strong>,
            </td>
          </tr>

          <!-- Message -->
          <tr>
            <td style="font-size: 15px; color: #444; line-height: 1.6; padding-top: 14px;">
              Yêu cầu nhận nuôi của bạn cho <strong>${data.petName}</strong> đã được cập nhật thành:
              <strong style="color: #2196F3;">${data.status.toUpperCase()}</strong>
            </td>
          </tr>

          <tr>
            <td style="font-size: 15px; color: #444; line-height: 1.6; padding-top: 14px;">
              ${data.message}
            </td>
          </tr>

          <!-- View Details Button -->
          <tr>
            <td align="center" style="padding-top: 26px;">
              <a href="${data.detailsUrl}"
                 style="background: #2196F3; color: #ffffff; text-decoration: none;
                        padding: 14px 32px; font-size: 15px; border-radius: 6px; font-weight: bold; display: inline-block;">
                Xem chi tiết
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="font-size: 13px; color: #888; padding-top: 35px;">
              🐾 Cảm ơn bạn đã cho thú cưng một cơ hội thứ hai. <br/><br/>
              <strong>Đội ngũ Second Chance Sanctuary</strong>
            </td>
          </tr>

        </table>
      </div>
    </body>
    </html>
  `,

  rescueStatusUpdate: (data: {
    firstName: string;
    lastName: string;
    rescueId: string;
    status: string;
    message: string;
    detailsUrl: string;
  }) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body>
      <div style="font-family: Arial, sans-serif; background: #f5f7fa; padding: 24px;">
        <table align="center" cellpadding="0" cellspacing="0" width="100%" 
               style="max-width: 600px; background: #ffffff; border-radius: 12px; padding: 24px;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom: 20px;">
              <img src="https://res.cloudinary.com/drujd0cbj/image/upload/v1762537915/logo_hktthj.png"
                   alt="App Logo"
                   style="max-width: 90%; height: auto;" />
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td align="center" style="font-size: 22px; color: #333; font-weight: bold; padding-bottom: 12px;">
              Cập nhật nhiệm vụ cứu hộ
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="font-size: 15px; color: #444; line-height: 1.6;">
              Kính gửi <strong>${data.firstName} ${data.lastName}</strong>,
            </td>
          </tr>

          <!-- Message -->
          <tr>
            <td style="font-size: 15px; color: #444; line-height: 1.6; padding-top: 14px;">
              Nhiệm vụ cứu hộ <strong>#${data.rescueId}</strong> của bạn đã được cập nhật thành:
              <strong style="color: #FF9800;">${data.status.toUpperCase()}</strong>
            </td>
          </tr>

          <tr>
            <td style="font-size: 15px; color: #444; line-height: 1.6; padding-top: 14px;">
              ${data.message}
            </td>
          </tr>

          <!-- View Details Button -->
          <tr>
            <td align="center" style="padding-top: 26px;">
              <a href="${data.detailsUrl}"
                 style="background: #FF9800; color: #ffffff; text-decoration: none;
                        padding: 14px 32px; font-size: 15px; border-radius: 6px; font-weight: bold; display: inline-block;">
                Xem chi tiết cứu hộ
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="font-size: 13px; color: #888; padding-top: 35px;">
              🐾 Thank you for helping animals in need. <br/><br/>
              <strong>Second Chance Sanctuary Team</strong>
            </td>
          </tr>

        </table>
      </div>
    </body>
    </html>
  `,

  reportStatusUpdate: (data: {
    firstName: string;
    lastName: string;
    reportId: string;
    status: string;
    message: string;
    detailsUrl: string;
  }) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body>
      <div style="font-family: Arial, sans-serif; background: #f5f7fa; padding: 24px;">
        <table align="center" cellpadding="0" cellspacing="0" width="100%" 
               style="max-width: 600px; background: #ffffff; border-radius: 12px; padding: 24px;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom: 20px;">
              <img src="https://res.cloudinary.com/drujd0cbj/image/upload/v1762537915/logo_hktthj.png"
                   alt="App Logo"
                   style="max-width: 90%; height: auto;" />
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td align="center" style="font-size: 22px; color: #333; font-weight: bold; padding-bottom: 12px;">
              Animal Report Update
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="font-size: 15px; color: #444; line-height: 1.6;">
              Dear <strong>${data.firstName} ${data.lastName}</strong>,
            </td>
          </tr>

          <!-- Message -->
          <tr>
            <td style="font-size: 15px; color: #444; line-height: 1.6; padding-top: 14px;">
              Your report <strong>#${data.reportId}</strong> has been updated to: 
              <strong style="color: #9C27B0;">${data.status.toUpperCase()}</strong>
            </td>
          </tr>

          <tr>
            <td style="font-size: 15px; color: #444; line-height: 1.6; padding-top: 14px;">
              ${data.message}
            </td>
          </tr>

          <!-- View Details Button -->
          <tr>
            <td align="center" style="padding-top: 26px;">
              <a href="${data.detailsUrl}"
                 style="background: #9C27B0; color: #ffffff; text-decoration: none;
                        padding: 14px 32px; font-size: 15px; border-radius: 6px; font-weight: bold; display: inline-block;">
                View Report Details
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="font-size: 13px; color: #888; padding-top: 35px;">
              🐾 Thank you for reporting and caring about animal welfare. <br/><br/>
              <strong>Second Chance Sanctuary Team</strong>
            </td>
          </tr>

        </table>
      </div>
    </body>
    </html>
  `,

  rescueAssignment: (data: {
    firstName: string;
    lastName: string;
    rescueId: string;
    location: string;
    description: string;
    detailsUrl: string;
  }) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body>
      <div style="font-family: Arial, sans-serif; background: #f5f7fa; padding: 24px;">
        <table align="center" cellpadding="0" cellspacing="0" width="100%" 
               style="max-width: 600px; background: #ffffff; border-radius: 12px; padding: 24px;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom: 20px;">
              <img src="https://res.cloudinary.com/drujd0cbj/image/upload/v1762537915/logo_hktthj.png"
                   alt="App Logo"
                   style="max-width: 90%; height: auto;" />
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td align="center" style="font-size: 22px; color: #333; font-weight: bold; padding-bottom: 12px;">
              New Rescue Assignment
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="font-size: 15px; color: #444; line-height: 1.6;">
              Dear <strong>${data.firstName} ${data.lastName}</strong>,
            </td>
          </tr>

          <!-- Message -->
          <tr>
            <td style="font-size: 15px; color: #444; line-height: 1.6; padding-top: 14px;">
              You have been assigned to a new rescue mission <strong>#${data.rescueId}</strong>.
            </td>
          </tr>

          <tr>
            <td style="font-size: 15px; color: #444; line-height: 1.6; padding-top: 14px;">
              <strong>Location:</strong> ${data.location}<br/>
              <strong>Description:</strong> ${data.description}
            </td>
          </tr>

          <!-- View Details Button -->
          <tr>
            <td align="center" style="padding-top: 26px;">
              <a href="${data.detailsUrl}"
                 style="background: #FF5722; color: #ffffff; text-decoration: none;
                        padding: 14px 32px; font-size: 15px; border-radius: 6px; font-weight: bold; display: inline-block;">
                View Mission Details
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="font-size: 13px; color: #888; padding-top: 35px;">
              🐾 Thank you for being a hero to animals in need. <br/><br/>
              <strong>Second Chance Sanctuary Team</strong>
            </td>
          </tr>

        </table>
      </div>
    </body>
    </html>
  `,

  generic: (data: {
    title: string;
    greeting: string;
    message: string;
    details?: string[];
    actionUrl?: string;
    actionText?: string;
  }) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body>
      <div style="font-family: Arial, sans-serif; background: #f5f7fa; padding: 24px;">
        <table align="center" cellpadding="0" cellspacing="0" width="100%" 
               style="max-width: 600px; background: #ffffff; border-radius: 12px; padding: 24px;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom: 20px;">
              <img src="https://res.cloudinary.com/drujd0cbj/image/upload/v1762537915/logo_hktthj.png"
                   alt="App Logo"
                   style="max-width: 90%; height: auto;" />
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td align="center" style="font-size: 22px; color: #333; font-weight: bold; padding-bottom: 12px;">
              ${data.title}
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="font-size: 15px; color: #444; line-height: 1.6;">
              ${data.greeting}
            </td>
          </tr>

          <!-- Message -->
          <tr>
            <td style="font-size: 15px; color: #444; line-height: 1.6; padding-top: 14px;">
              ${data.message}
            </td>
          </tr>

          ${data.details && data.details.length > 0 ? `
          <!-- Details -->
          <tr>
            <td style="font-size: 15px; color: #444; line-height: 1.8; padding-top: 14px; background: #f9fafb; padding: 16px; border-radius: 6px; margin-top: 14px;">
              ${data.details.join('<br/>')}
            </td>
          </tr>
          ` : ''}

          ${data.actionUrl && data.actionText ? `
          <!-- Action Button -->
          <tr>
            <td align="center" style="padding-top: 26px;">
              <a href="${data.actionUrl}"
                 style="background: #1976D2; color: #ffffff; text-decoration: none;
                        padding: 14px 32px; font-size: 15px; border-radius: 6px; font-weight: bold; display: inline-block;">
                ${data.actionText}
              </a>
            </td>
          </tr>
          ` : ''}

          <!-- Footer -->
          <tr>
            <td align="center" style="font-size: 13px; color: #888; padding-top: 35px;">
              🐾 Second Chance Sanctuary <br/><br/>
              <strong>Making a difference, one animal at a time</strong>
            </td>
          </tr>

        </table>
      </div>
    </body>
    </html>
  `,
};
