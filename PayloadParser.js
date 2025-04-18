function parseUplink(device, payload)
{
    // Obtener payload como JSON
    const jsonPayload = payload.asJsonObject();

    if (!jsonPayload) { return; }

    const timestamp = jsonPayload.timestamp || null; // ✅ Usaremos esto para temperatura
    const posTimestamp = jsonPayload.posTimestamp || null;

    // ----------------------------
    // Actualizar estado de baterías
    if (jsonPayload.battery) {
        const batteries = [];
        for (var [key, value] of Object.entries(jsonPayload.battery)) {
            batteries.push({type: batteryType[key], voltage: value});
        }
        device.updateDeviceBattery(batteries);
    }

    // ----------------------------
    // Actualizar RSSI
    if (jsonPayload.rssi) {
        const rssi = [];
        for (var [key, value] of Object.entries(jsonPayload.rssi)) {
            rssi.push({type: rssiType[key], quality: value});
        }
        device.updateDeviceRssi(rssi);
    }

    // ----------------------------
    // Manejo de ubicación (solo si hay)
    let flags = jsonPayload.flags || locationTrackerFlags.none;
    const locationTracker = device.endpoints.byAddress(1);

    if (jsonPayload.latitude !== undefined && jsonPayload.longitude !== undefined) {
        locationTracker.updateLocationTrackerStatus(
            jsonPayload.latitude,
            jsonPayload.longitude,
            jsonPayload.altitude || 0,
            flags,
            posTimestamp
        );
    } else {
        env.log("No se recibieron datos de ubicación, informando sin posición.");
        locationTracker.updateLocationTrackerStatus(
            0, 0, 0,
            locationTrackerFlags.noPosition
        );
    }

    // ----------------------------
    // Temperatura (siempre con timestamp, no con posTimestamp) ✅
    if (jsonPayload.temperature != null) {
        const temperatureSensor = device.endpoints.byAddress(2);

        if (jsonPayload.temperature < 100 && jsonPayload.temperature !== 0 && jsonPayload.temperature > -25) {
            temperatureSensor.updateTemperatureSensorStatus(jsonPayload.temperature, timestamp); // ✅ CAMBIO CLAVE
        } else {
            env.log("Temperatura fuera del rango operacional", jsonPayload.temperature);
        }
    }

    // ----------------------------
    // Firmware
    if (jsonPayload.fw != undefined && jsonPayload.fw != null) {
        const fw = jsonPayload.fw;
        env.log("fw --> ", fw);
        let cortar = fw.split('-');
        let aux = cortar[0];
        let aux1 = cortar[1];
        let aux2 = aux.concat(".", aux1);  
        let text = aux2.toString();     
        device.updateDeviceFirmwareVersion(text);
        env.log("text ", text);
    }
}
