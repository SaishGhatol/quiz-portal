const ContactMessage = require('../models/contactMessage.model');

exports.submitMessage = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim())
      return res.status(400).json({ message: 'All fields are required' });

    await ContactMessage.create({
      name: name.trim(), email: email.trim(), subject: subject.trim(), message: message.trim(),
    });

    res.status(201).json({ message: 'Message received' });
  } catch (err) {
    console.error('Contact submit error:', err);
    res.status(500).json({ message: 'Could not send your message. Please try again or email us directly.' });
  }
};
