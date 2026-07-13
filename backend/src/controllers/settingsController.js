import Setting from '../models/Setting.js';

export const getSettings = async (req, res) => {
  try {
    let settings = await Setting.findOne({ user: req.user._id });
    if (!settings) {
      settings = await Setting.create({ user: req.user._id });
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const settings = await Setting.findOneAndUpdate(
      { user: req.user._id },
      { $set: req.body },
      { new: true, upsert: true }
    );
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
