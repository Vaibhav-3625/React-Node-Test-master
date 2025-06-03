const mongoose = require('mongoose');

const meetingHistory = new mongoose.Schema({
    agenda: { type: String, required: true },
    attendes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'contacts',
    }],
    attendesLead: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'leads',
    }],
    location: String,
    related: String,
    dateTime: String,
    notes: String,
    // meetingReminders: { type: String, required: true },
    createBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        require: true,
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    deleted: {
        type: Boolean,
        default: false,
    },
})

module.exports = mongoose.model('meetings', meetingHistory, 'meetings');
