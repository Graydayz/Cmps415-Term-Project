// controllers/TopicController.js
const User = require("../models/User");
const Topic = require("../models/Topic");
const Message = require("../models/Message");
const topicNotifier = require("../observers/TopicStatsObserver");

module.exports = {
  async dashboard(req, res) {
    const user = await User.findById(req.session.userId).populate(
      "subscribedTopics"
    );
    const topics = user.subscribedTopics;

    const topicMessages = {};
    for (const topic of topics) {
      topicNotifier.update("TOPIC_VIEWED", { topicId: topic._id }); // FIXED

      const messages = await Message.find({ topic: topic._id })
        .sort({ createdAt: -1 })
        .limit(2);
      topicMessages[topic._id] = messages;
    }

    res.render("dashboard", { user, topics, topicMessages });
  },

  async listAll(req, res) {
    const topics = await Topic.find({});
    res.render("topics", { topics });
  },

  async create(req, res) {
    const userId = req.session.userId;
    const topic = await Topic.create({
      title: req.body.title,
      createdBy: userId,
    });
    await User.findByIdAndUpdate(userId, {
      $addToSet: { subscribedTopics: topic._id },
    });
    res.redirect("/dashboard");
  },

  async subscribe(req, res) {
    await User.findByIdAndUpdate(req.session.userId, {
      $addToSet: { subscribedTopics: req.params.id },
    });
    res.redirect("/dashboard");
  },

  async unsubscribe(req, res) {
    await User.findByIdAndUpdate(req.session.userId, {
      $pull: { subscribedTopics: req.params.id },
    });
    res.redirect("/dashboard");
  },

  async topicStats(req, res) {
    const topics = await Topic.find({}, "title accessCount").sort({
      accessCount: -1,
    });
    res.json(topics);
  },
};
