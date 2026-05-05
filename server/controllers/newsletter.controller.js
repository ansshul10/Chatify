import Newsletter from '../models/Newsletter.model.js';
import * as api from '../utils/apiResponse.js';

/**
 * Public: Subscribe to newsletter
 */
export async function subscribe(req, res) {
  const { email } = req.body;

  if (!email) {
    return api.error(res, 'CHAT_ERR_090', 'Email is required', 400);
  }

  try {
    const existing = await Newsletter.findOne({ email });
    if (existing) {
      if (!existing.isActive) {
        existing.isActive = true;
        await existing.save();
        return api.success(res, { message: 'Resubscribed successfully' });
      }
      return api.conflict(res, 'You are already subscribed to our newsletter');
    }

    const subscription = await Newsletter.create({ email });
    api.success(res, { message: 'Subscribed successfully', subscription }, 201);
  } catch (err) {
    api.serverError(res, err);
  }
}

/**
 * Admin: Get all subscribers
 */
export async function getSubscribers(req, res) {
  try {
    const subscribers = await Newsletter.find().sort({ subscribedAt: -1 });
    api.success(res, { subscribers });
  } catch (err) {
    api.serverError(res, err);
  }
}

export default { subscribe, getSubscribers };
