import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface OnDisplayAuctionState {
  lastAuctionSportsManagerId: number | undefined;
  onDisplayAuctionSportsManagerId: number | undefined;
}

const initialState: OnDisplayAuctionState = {
  lastAuctionSportsManagerId: undefined,
  onDisplayAuctionSportsManagerId: undefined,
};

const onDisplayAuction = createSlice({
  name: 'onDisplayAuction',
  initialState: initialState,
  reducers: {
    setLastAuctionSportsManagerId: (state, action: PayloadAction<number>) => {
      state.lastAuctionSportsManagerId = action.payload;
    },
    setOnDisplayAuctionSportsManagerId: (state, action: PayloadAction<number>) => {
      state.onDisplayAuctionSportsManagerId = action.payload;
    },
    setPrevOnDisplayAuctionSportsManagerId: state => {
      if (!state.onDisplayAuctionSportsManagerId) return;
      if (state.onDisplayAuctionSportsManagerId === 0) return;
      state.onDisplayAuctionSportsManagerId = state.onDisplayAuctionSportsManagerId - 1;
    },
    setNextOnDisplayAuctionSportsManagerId: state => {
      if (state.onDisplayAuctionSportsManagerId === undefined) return;
      if (state.lastAuctionSportsManagerId === state.onDisplayAuctionSportsManagerId) return;
      state.onDisplayAuctionSportsManagerId = state.onDisplayAuctionSportsManagerId + 1;
    },
  },
});

export const {
  setLastAuctionSportsManagerId,
  setOnDisplayAuctionSportsManagerId,
  setPrevOnDisplayAuctionSportsManagerId,
  setNextOnDisplayAuctionSportsManagerId,
} = onDisplayAuction.actions;

export default onDisplayAuction.reducer;
