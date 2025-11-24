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
              Adoption Confirmation Required
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
              Thank you for your interest in adopting 
              <strong>${data.petName}</strong> (${data.petSpecies})! 
              To proceed, please confirm your adoption request within the next 
              <strong>${data.expiresIn}</strong>.
            </td>
          </tr>

          <!-- Confirm Button -->
          <tr>
            <td align="center" style="padding-top: 26px;">
              <a href="${data.confirmUrl}"
                 style="background: #4CAF50; color: #ffffff; text-decoration: none;
                        padding: 14px 32px; font-size: 15px; border-radius: 6px; font-weight: bold; display: inline-block;">
                Confirm Adoption
              </a>
            </td>
          </tr>

          <!-- Cancel Text -->
          <tr>
            <td style="font-size: 15px; color: #444; line-height: 1.6; padding-top: 24px;">
              If you've changed your mind, you can cancel your request instead:
            </td>
          </tr>

          <!-- Cancel Button -->
          <tr>
            <td align="center" style="padding-top: 16px;">
              <a href="${data.cancelUrl}"
                 style="background: #f44336; color: #ffffff; text-decoration: none;
                        padding: 14px 32px; font-size: 15px; border-radius: 6px; font-weight: bold; display: inline-block;">
                Cancel Request
              </a>
            </td>
          </tr>

          <!-- Safely Ignore -->
          <tr>
            <td style="font-size: 14px; color: #555; line-height: 1.5; padding-top: 28px;">
              If you did not make this request, please ignore this email.
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="font-size: 13px; color: #888; padding-top: 35px;">
              🐾 Thank you for giving a pet a second chance. <br/><br/>
              <strong>Second Chance Sanctuary Team</strong>
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
              Adoption Status Update
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
              Your adoption request for <strong>${data.petName}</strong> has been updated to: 
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
                View Details
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="font-size: 13px; color: #888; padding-top: 35px;">
              🐾 Thank you for giving a pet a second chance. <br/><br/>
              <strong>Second Chance Sanctuary Team</strong>
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
              Rescue Mission Update
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
              Your rescue mission <strong>#${data.rescueId}</strong> has been updated to: 
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
                View Rescue Details
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
};
