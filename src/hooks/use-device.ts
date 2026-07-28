import { useEffect, useState } from "react";
import * as Device from "expo-device";
import * as Application from "expo-application";

export function useDevice() {
  const [deviceId, setDeviceId] = useState("unknown-device");

  useEffect(() => {
    async function init() {
      if (Device.osName === "Android") {
        const androidId = await Application.getAndroidId();
        setDeviceId(androidId ?? "unknown-device");
      } else if (Device.osName === "iOS") {
        const id = await Application.getIosIdForVendorAsync();
        setDeviceId(id ?? "unknown-device");
      }
    }

    init();
  }, []);

  return {
    deviceId,
    deviceName: Device.deviceName,
    brand: Device.brand,
    modelName: Device.modelName,
    osName: Device.osName,
    osVersion: Device.osVersion,
    deviceType: Device.deviceType,
  };
}
