import Contact from '../models/contact.model.js';

// @desc    Submit Contact Form
// @route   POST /api/contact
// @access  Public
export const submitContact = async (req, res, next) => {
  try {
    const { name, email, topic, message } = req.body;

    // Create new contact submission
    const newContact = new Contact({
      name,
      email,
      topic,
      message
    });

    // Save to database
    const savedContact = await newContact.save();

    console.log(`New contact message received from ${email} regarding: ${topic}`);

    return res.status(201).json({
      success: true,
      message: 'Your message has been successfully saved.',
      data: {
        id: savedContact._id,
        name: savedContact.name,
        email: savedContact.email,
        topic: savedContact.topic,
        createdAt: savedContact.createdAt
      }
    });

  } catch (error) {
    console.error('Error saving contact form submission:', error.message);

    // Mongoose validation error handling
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: messages
      });
    }

    // Pass any other errors to global error handler middleware
    next(error);
  }
};

// @desc    Get API Server Health Status
// @route   GET /api/health
// @access  Public
export const getHealth = (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date()
  });
};
