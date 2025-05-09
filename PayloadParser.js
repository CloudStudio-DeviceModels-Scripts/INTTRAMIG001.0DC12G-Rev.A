function parseUplink(device, payload)
{
    // Obtener payload como JSON
    const jsonPayload = payload.asJsonObject();

    // No se puede deserializar el payload como json, salir.
    if (!jsonPayload) { return; }

    // Verificar que la dirección del dispositivo sea la correcta
    if (jsonPayload.deviceAddress.toString() !== device.address.toString()) {
        env.log('Invalid device address');
        return;
    }

    const posTimestamp = (jsonPayload.posTimestamp) ? jsonPayload.posTimestamp : null;
    
    // Actualizar estado de las baterías
    if (jsonPayload.battery) {
        const batteries = [];
        for (var [key, value] of Object.entries(jsonPayload.battery)) {
            batteries.push({type: batteryType[key], voltage: value});
        }
        device.updateDeviceBattery(batteries);
    }
    
    // Actualizar RSSI
    if (jsonPayload.rssi) {
        const rssi = [];
        for (var [key, value] of Object.entries(jsonPayload.rssi)) {
            rssi.push({type: rssiType[key], quality: value});
        }
        device.updateDeviceRssi(rssi);
    }

    // Parsear y almacenar la ubicación
    let flags = (jsonPayload.flags) ? jsonPayload.flags : locationTrackerFlags.none;
    var locationTracker = device.endpoints.byAddress(1);
    locationTracker.updateLocationTrackerStatus(
        jsonPayload.latitude,
        jsonPayload.longitude,
        jsonPayload.altitude,
        flags,
        posTimestamp
    );

    // Parsear y almacenar la temperatura
    if (jsonPayload.temperature !== undefined && jsonPayload.temperature !== null) {
        var temperatureSensor = device.endpoints.byAddress(2);
        temperatureSensor.updateTemperatureSensorStatus(jsonPayload.temperature);
    }
}

function buildDownlink(device, endpoint, command, payload)
{
    payload.setAsString(command.custom.data);
    payload.requiresResponse = false;
	payload.buildResult = downlinkBuildResult.ok;
    return;
}