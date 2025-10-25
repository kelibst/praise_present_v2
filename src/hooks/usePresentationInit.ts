import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../lib/store";

/**
 * Presentation initialization hook
 *
 * Note: The new Redux-based presentation system initializes automatically
 * through the Redux store. This hook is kept for compatibility but is
 * now essentially a no-op.
 *
 * The presentation system will be ready to use immediately through the
 * usePresentation() hook.
 */
export const usePresentationInit = () => {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    // New Redux-based presentation system doesn't require explicit initialization
    // The store initializes with the proper initial state automatically
    console.log('[usePresentationInit] Presentation system ready (Redux-based)');
  }, [dispatch]);
};
