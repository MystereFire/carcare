const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || null,
    pass: process.env.SMTP_PASS || null,
  },
});

async function sendMaintenanceAlert(userEmail, userName, vehicleName, taskTitle, status, nextAtKm, nextAtDate) {
  if (!process.env.SMTP_USER) {
    console.log(`[Email Mock] Alerte envoyee a ${userEmail} : La tache "${taskTitle}" pour le vehicule "${vehicleName}" est desormais "${status}".`);
    return;
  }

  const dateStr = nextAtDate ? new Date(nextAtDate).toLocaleDateString('fr-FR') : '—';
  const kmStr = nextAtKm ? `${nextAtKm} km` : '—';

  const mailOptions = {
    from: `"CarCare Manager" <${process.env.SMTP_USER}>`,
    to: userEmail,
    subject: `⚠️ Rappel Entretien : ${taskTitle} pour votre ${vehicleName}`,
    html: `
      <h2>Bonjour ${userName || 'conducteur'},</h2>
      <p>Votre véhicule <strong>${vehicleName}</strong> nécessite une attention particulière.</p>
      <p>La tâche d'entretien suivante a changé de statut et est maintenant <strong>${status}</strong> :</p>
      <ul>
        <li><strong>Tâche</strong> : ${taskTitle}</li>
        <li><strong>Kilométrage prévu</strong> : ${kmStr}</li>
        <li><strong>Date prévue</strong> : ${dateStr}</li>
      </ul>
      <br>
      <p>Connectez-vous sur CarCare Manager pour plus de détails.</p>
      <p>L'équipe CarCare</p>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
  } catch (err) {
    console.error('Error sending email:', err);
  }
}

module.exports = {
  sendMaintenanceAlert,
};
