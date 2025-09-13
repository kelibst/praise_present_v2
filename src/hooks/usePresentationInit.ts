import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../lib/store";
import {
  initializePresentationSystem,
  sendContentToLiveDisplay,
  createDefaultPlaceholder,
} from "../lib/presentationSlice";

export const usePresentationInit = () => {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    // Initialize presentation system with placeholders on app start
    dispatch(initializePresentationSystem());

    // Initialize live display with placeholder after a short delay
    const initLiveDisplay = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait for app to fully load
        const placeholder = createDefaultPlaceholder();
        dispatch(sendContentToLiveDisplay(placeholder));
      } catch (error) {
        console.log(
          "Live display initialization will happen when first content is sent"
        );
      }
    };

    initLiveDisplay();
  }, [dispatch]);
};
