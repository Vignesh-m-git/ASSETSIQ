import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { AssetData } from '../types';
import { extractDataFromHtml, ModelProvider } from '../services/aiService';
import { supabase } from '../services/supabaseClient';
import { saveAssets } from '../services/assetService';

interface FileQueueItem {
  id: string;
  file: File;
  status: 'pending' | 'processing' | 'completed' | 'error';
  errorMessage?: string;
}

interface ToastMessage {
  type: 'success' | 'error' | 'info';
  message: string;
}

interface AssetContextType {
  data: AssetData[];
  setData: React.Dispatch<React.SetStateAction<AssetData[]>>;
  fileQueue: FileQueueItem[];
  addFilesToQueue: (files: File[]) => void;
  clearQueue: () => void;
  isQueueProcessing: boolean;
  toast: ToastMessage | null;
  clearToast: () => void;
  selectedModel: ModelProvider;
  setSelectedModel: (model: ModelProvider) => void;
}

const AssetContext = createContext<AssetContextType | undefined>(undefined);

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const AssetProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [data, setData] = useState<AssetData[]>([]);
  const [fileQueue, setFileQueue] = useState<FileQueueItem[]>([]);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelProvider>('gemini');

  // Ref to track processing status synchronously to avoid race conditions
  const processingRef = useRef(false);

  // Helper to check if we are visually processing for UI indicators
  const isQueueProcessing = fileQueue.some(item => item.status === 'processing' || item.status === 'pending');

  const clearToast = () => setToast(null);

  const addFilesToQueue = (files: File[]) => {
    const uniqueFiles: File[] = [];
    let skippedCount = 0;

    files.forEach(file => {
      // Check if file name already exists in the queue
      const exists = fileQueue.some(item => item.file.name === file.name);
      if (!exists) {
        uniqueFiles.push(file);
      } else {
        skippedCount++;
      }
    });

    if (skippedCount > 0) {
      setToast({
        type: 'error',
        message: `Skipped ${skippedCount} duplicate file(s). File names must be unique.`
      });
    } else if (uniqueFiles.length > 0) {
      setToast({
        type: 'success',
        message: `Added ${uniqueFiles.length} file(s) to queue.`
      });
    }

    if (uniqueFiles.length === 0) return;

    const newItems: FileQueueItem[] = uniqueFiles.map(f => ({
      id: Math.random().toString(36).substring(7),
      file: f,
      status: 'pending'
    }));
    setFileQueue(prev => [...prev, ...newItems]);
  };

  const clearQueue = () => {
    // Only clear items that are not currently processing
    setFileQueue(prev => prev.filter(item => item.status === 'processing'));
  };

  // The Master Processing Loop
  useEffect(() => {
    const processNextItem = async () => {
      if (processingRef.current) return;

      const pendingIndex = fileQueue.findIndex(item => item.status === 'pending');
      if (pendingIndex === -1) return;

      processingRef.current = true;

      // Mark status as processing
      setFileQueue(prev => {
        const next = [...prev];
        next[pendingIndex] = { ...next[pendingIndex], status: 'processing' };
        return next;
      });

      const currentItem = fileQueue[pendingIndex];
      let retries = 0;
      const maxRetries = 3;
      let success = false;
      let finalErrorMsg = '';

      while (retries <= maxRetries && !success) {
        try {
          // Rate Limiting Strategy
          if (retries > 0) {
            // Exponential Backoff for retries: 5s, 10s, 20s
            const waitTime = Math.pow(2, retries) * 2500;
            console.warn(`Rate limit hit for ${currentItem.file.name}. Retrying in ${waitTime}ms...`);
            await sleep(waitTime);
          } else {
            // Standard delay between files to respect RPM limits (2 seconds)
            await sleep(2000);
          }

          const textContent = await currentItem.file.text();
          const results = await extractDataFromHtml(textContent, currentItem.file.name, selectedModel);

          setData(prev => {
            // Filter out items that already exist based on 'Asset Tag'
            const newUniqueItems = results.filter(newItem =>
              !prev.some(existingItem => existingItem["Asset Tag"] === newItem["Asset Tag"])
            );
            return [...prev, ...newUniqueItems];
          });

          // Background Save
          const { data: { user } } = await supabase.auth.getUser();
          if (user && process.env.SUPABASE_URL) {
            // Save to extraction history
            await supabase.from('extraction_history').insert({
              user_id: user.id,
              filename: currentItem.file.name,
              extracted_json: results,
            });

            // Save to assets table
            await saveAssets(results);
          }

          success = true;

        } catch (error: any) {
          console.error(`Attempt ${retries + 1} failed for ${currentItem.file.name}:`, error);

          // Check for Rate Limit (429) errors
          const errorString = JSON.stringify(error) + (error.message || '');
          const isRateLimit = errorString.includes('429') ||
            errorString.includes('RESOURCE_EXHAUSTED') ||
            errorString.includes('quota');

          if (isRateLimit && retries < maxRetries) {
            retries++;
            // Loop continues to retry
          } else {
            finalErrorMsg = error.message || 'Processing Failed';
            break; // Exit loop on non-retriable error or max retries reached
          }
        }
      }

      setFileQueue(prev => {
        const next = [...prev];
        next[pendingIndex] = {
          ...next[pendingIndex],
          status: success ? 'completed' : 'error',
          errorMessage: success ? undefined : finalErrorMsg
        };
        return next;
      });

      processingRef.current = false;
    };

    processNextItem();
  }, [fileQueue, selectedModel]);

  return (
    <AssetContext.Provider value={{
      data,
      setData,
      fileQueue,
      addFilesToQueue,
      clearQueue,
      isQueueProcessing,
      toast,
      clearToast,
      selectedModel,
      setSelectedModel
    }}>
      {children}
    </AssetContext.Provider>
  );
};

export const useAssetContext = () => {
  const context = useContext(AssetContext);
  if (context === undefined) {
    throw new Error('useAssetContext must be used within an AssetProvider');
  }
  return context;
};