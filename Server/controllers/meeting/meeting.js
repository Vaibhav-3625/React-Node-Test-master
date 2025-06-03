const mongoose = require('mongoose');
const Meeting = require('../../model/schema/meeting');
const Contact = require('../../model/schema/contact');
const Lead = require('../../model/schema/lead');
const User = require('../../model/schema/user');

// Reusable aggregation pipeline for consistent data format
const getMeetingPipeline = (matchStage) => [
    { $match: matchStage },
    {
        $lookup: {
            from: 'users',
            localField: 'createBy',
            foreignField: '_id',
            as: 'creator'
        }
    },
    {
        $lookup: {
            from: 'contacts',
            localField: 'attendes',
            foreignField: '_id',
            as: 'attendesDetails'
        }
    },
    {
        $lookup: {
            from: 'leads',
            localField: 'attendesLead',
            foreignField: '_id',
            as: 'attendesLeadDetails'
        }
    },
    { 
        $unwind: { 
            path: '$creator', 
            preserveNullAndEmptyArrays: true 
        } 
    },
    {
        $addFields: {
            createdByName: {
                $cond: {
                    if: '$creator',
                    then: {
                        $concat: [
                            { $ifNull: ['$creator.firstName', ''] },
                            ' ',
                            { $ifNull: ['$creator.lastName', ''] }
                        ]
                    },
                    else: 'Unknown'
                }
            },
            attendes: {
                $map: {
                    input: '$attendesDetails',
                    as: 'contact',
                    in: {
                        _id: '$$contact._id',
                        email: { $ifNull: ['$$contact.email', ''] }
                    }
                }
            },
            attendesLead: {
                $map: {
                    input: '$attendesLeadDetails',
                    as: 'lead',
                    in: {
                        _id: '$$lead._id',
                        leadName: { $ifNull: ['$$lead.leadName', ''] }
                    }
                }
            }
        }
    },
    {
        $project: {
            _id: 1,
            agenda: 1,
            location: 1,
            related: 1,
            dateTime: 1,
            notes: 1,
            timestamp: 1,
            createdByName: 1,
            attendes: 1,
            attendesLead: 1
        }
    }
];

// Validate meeting input
const validateMeetingInput = (data) => {
    const errors = {};
    
    if (!data.agenda?.trim()) {
        errors.agenda = 'Agenda is required';
    }
    
    if (!data.dateTime) {
        errors.dateTime = 'Date Time is required';
    }
    
    if (!data.related) {
        errors.related = 'Related field is required';
    }
    
    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

// Get all meetings
const index = async (req, res) => {
    try {
        const query = { ...req.query, deleted: false };
        const meetings = await Meeting.aggregate([
            ...getMeetingPipeline(query),
            { $sort: { timestamp: -1 } }
        ]);

        res.json(meetings);
    } catch (error) {
        console.error('Get meetings error:', error);
        res.status(500).json({ 
            message: 'Error fetching meetings',
            error: error.message 
        });
    }
};

// Add new meeting
const add = async (req, res) => {
    try {
        const { agenda, attendes, attendesLead, location, related, dateTime, notes } = req.body;
        
        // Validate input
        const validation = validateMeetingInput(req.body);
        if (!validation.isValid) {
            return res.status(400).json({ 
                message: 'Validation failed',
                errors: validation.errors 
            });
        }

        // Create meeting object
        const meeting = new Meeting({
            agenda,
            attendes: attendes || [],
            attendesLead: attendesLead || [],
            location,
            related,
            dateTime,
            notes,
            createBy: req.user._id
        });

        const savedMeeting = await meeting.save();
        
        // Get populated meeting data
        const [populatedMeeting] = await Meeting.aggregate(
            getMeetingPipeline({ _id: savedMeeting._id })
        );

        res.status(201).json(populatedMeeting);
    } catch (error) {
        console.error('Add meeting error:', error);
        res.status(400).json({ 
            message: 'Error creating meeting',
            error: error.message 
        });
    }
};

// View single meeting
const view = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid meeting ID format' });
        }

        const [meeting] = await Meeting.aggregate(
            getMeetingPipeline({ 
                _id: new mongoose.Types.ObjectId(id), 
                deleted: false 
            })
        );

        if (!meeting) {
            return res.status(404).json({ message: 'Meeting not found' });
        }

        res.json(meeting);
    } catch (error) {
        console.error('View meeting error:', error);
        res.status(500).json({ 
            message: 'Error fetching meeting',
            error: error.message 
        });
    }
};

// Soft delete single meeting
const deleteData = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid meeting ID format' });
        }

        const meeting = await Meeting.findOneAndUpdate(
            { _id: id, deleted: false },
            { deleted: true },
            { new: true }
        );
        
        if (!meeting) {
            return res.status(404).json({ message: 'Meeting not found or already deleted' });
        }

        res.json({ message: 'Meeting deleted successfully' });
    } catch (error) {
        console.error('Delete meeting error:', error);
        res.status(500).json({ 
            message: 'Error deleting meeting',
            error: error.message 
        });
    }
};

// Soft delete multiple meetings
const deleteMany = async (req, res) => {
    try {
        if (!Array.isArray(req.body) || req.body.length === 0) {
            return res.status(400).json({ message: 'Invalid input: Expected array of meeting IDs' });
        }

        const result = await Meeting.updateMany(
            { 
                _id: { $in: req.body },
                deleted: false
            },
            { $set: { deleted: true } }
        );
    
        res.status(200).json({ 
            message: 'Meetings deleted successfully',
            deletedCount: result.modifiedCount
        });
    } catch (error) {
        console.error('Delete meetings error:', error);
        res.status(400).json({ 
            message: 'Error deleting meetings',
            error: error.message 
        });
    }
};

module.exports = { add, index, view, deleteData, deleteMany };