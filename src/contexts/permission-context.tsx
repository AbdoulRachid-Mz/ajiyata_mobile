import Constants from "expo-constants";
import * as ImagePicker from "expo-image-picker";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { ExecutionEnvironment } from "expo-constants";

const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Import types for type purposes, but dynamically import actual modules
let Notifications: any;
let MediaLibrary: any;

if (!isExpoGo) {
  Notifications = require("expo-notifications");
  MediaLibrary = require("expo-media-library");
}

interface PermissionContextType {
  notifications: {
    status: any;
    request: () => Promise<any>;
  };
  camera: {
    status: ImagePicker.PermissionStatus | null;
    request: () => Promise<ImagePicker.PermissionStatus>;
  };
  mediaLibrary: {
    status: any;
    request: () => Promise<any>;
  };
}

const PermissionContext = createContext<PermissionContextType | undefined>(
  undefined,
);

export const usePermissions = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error("usePermissions must be used within a PermissionProvider");
  }
  return context;
};

export const PermissionProvider = ({ children }: { children: ReactNode }) => {
  const [notificationStatus, setNotificationStatus] =
    useState<any>(null);
  const [cameraStatus, setCameraStatus] =
    useState<ImagePicker.PermissionStatus | null>(null);
  const [mediaLibraryStatus, setMediaLibraryStatus] =
    useState<any>(null);

  useEffect(() => {
    const checkInitialPermissions = async () => {
      if (!isExpoGo && Notifications && MediaLibrary) {
        const notifStatus = await Notifications.getPermissionsAsync();
        setNotificationStatus(notifStatus.status);

        const camStatus = await ImagePicker.getCameraPermissionsAsync();
        setCameraStatus(camStatus.status);

        const mediaStatus = await MediaLibrary.getPermissionsAsync();
        setMediaLibraryStatus(mediaStatus.status);
      }
    };
    checkInitialPermissions();
  }, []);

  const requestNotificationPermission = async () => {
    if (isExpoGo || !Notifications) return "undetermined";
    const { status } = await Notifications.requestPermissionsAsync();
    setNotificationStatus(status);
    return status;
  };

  const requestCameraPermission = async () => {
    if (isExpoGo) return "undetermined" as ImagePicker.PermissionStatus;
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    setCameraStatus(status);
    return status;
  };

  const requestMediaLibraryPermission = async () => {
    if (isExpoGo || !MediaLibrary) return "undetermined";
    const { status } = await MediaLibrary.requestPermissionsAsync();
    setMediaLibraryStatus(status);
    return status;
  };

  return (
    <PermissionContext.Provider
      value={{
        notifications: {
          status: notificationStatus,
          request: requestNotificationPermission,
        },
        camera: {
          status: cameraStatus,
          request: requestCameraPermission,
        },
        mediaLibrary: {
          status: mediaLibraryStatus,
          request: requestMediaLibraryPermission,
        },
      }}
    >
      {children}
    </PermissionContext.Provider>
  );
};