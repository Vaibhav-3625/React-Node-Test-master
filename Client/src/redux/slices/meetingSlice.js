import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getApi, postApi, deleteApi } from '../../services/api';

// Thunk actions
export const fetchMeetingData = createAsyncThunk(
    'meeting/fetchAll',
    async (_, { rejectWithValue }) => {
        try {
    const user = JSON.parse(localStorage.getItem("user"));
            const response = await getApi(
                user.role === 'superAdmin' 
                    ? 'api/meeting' 
                    : `api/meeting/?createBy=${user._id}`
            );
            return response;
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: error.message });
        }
    }
);

export const fetchSingleMeeting = createAsyncThunk(
    'meeting/fetchSingle',
    async (id, { rejectWithValue }) => {
        try {
            const response = await getApi(`api/meeting/${id}`);
            return response;
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: error.message });
        }
    }
);

export const createMeeting = createAsyncThunk(
    'meeting/create',
    async (meetingData, { rejectWithValue }) => {
        try {
            const response = await postApi('api/meeting/add', meetingData);
        return response;
    } catch (error) {
            return rejectWithValue(error.response?.data || { message: error.message });
        }
    }
);

export const deleteMeeting = createAsyncThunk(
    'meeting/delete',
    async (id, { rejectWithValue }) => {
        try {
            await deleteApi('api/meeting/delete/', id);
            return id;
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: error.message });
    }
    }
);

const meetingSlice = createSlice({
    name: 'meetingData',
    initialState: {
        data: [],
        currentMeeting: null,
        isLoading: false,
        error: null,
        lastFetched: null,
        cache: {},
    },
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        clearCurrentMeeting: (state) => {
            state.currentMeeting = null;
        },
        updateMeetingInList: (state, action) => {
            const index = state.data.findIndex(meeting => meeting._id === action.payload._id);
            if (index !== -1) {
                state.data[index] = action.payload;
            }
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch all meetings
            .addCase(fetchMeetingData.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchMeetingData.fulfilled, (state, action) => {
                state.isLoading = false;
                state.data = action.payload;
                state.lastFetched = Date.now();
            })
            .addCase(fetchMeetingData.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload || { message: 'Failed to fetch meetings' };
            })
            
            // Fetch single meeting
            .addCase(fetchSingleMeeting.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchSingleMeeting.fulfilled, (state, action) => {
                state.isLoading = false;
                state.currentMeeting = action.payload;
                state.cache[action.payload._id] = {
                    data: action.payload,
                    timestamp: Date.now()
                };
            })
            .addCase(fetchSingleMeeting.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload || { message: 'Failed to fetch meeting' };
            })
            
            // Create meeting
            .addCase(createMeeting.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(createMeeting.fulfilled, (state, action) => {
                state.isLoading = false;
                state.data.unshift(action.payload);
                state.cache[action.payload._id] = {
                    data: action.payload,
                    timestamp: Date.now()
                };
            })
            .addCase(createMeeting.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload || { message: 'Failed to create meeting' };
            })
            
            // Delete meeting
            .addCase(deleteMeeting.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(deleteMeeting.fulfilled, (state, action) => {
                state.isLoading = false;
                state.data = state.data.filter(meeting => meeting._id !== action.payload);
                delete state.cache[action.payload];
                if (state.currentMeeting?._id === action.payload) {
                    state.currentMeeting = null;
                }
            })
            .addCase(deleteMeeting.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload || { message: 'Failed to delete meeting' };
            });
    },
});

export const { clearError, clearCurrentMeeting, updateMeetingInList } = meetingSlice.actions;
export default meetingSlice.reducer;