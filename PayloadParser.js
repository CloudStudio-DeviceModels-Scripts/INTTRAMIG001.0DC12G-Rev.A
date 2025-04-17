function parseUplink(device, payload)
{
    
    // Obtener payload como JSON
    const jsonPayload = payload.asJsonObject();

    // No se puede deserializar el payload como json, salir.
    if (!jsonPayload) { return; }

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
    //28ENE2025 M.MAdariaga se modifico para manejar el error cundo el GPS no tiene recepcion de señal GPS y no formatea
    //el JSON, por lo que devolvia un error el Broker
    let flags = jsonPayload.flags || locationTrackerFlags.none;
    const locationTracker = device.endpoints.byAddress(1);

    if (jsonPayload.latitude !== undefined && jsonPayload.longitude !== undefined) {
        // Caso: Hay datos de posición
        locationTracker.updateLocationTrackerStatus(
            jsonPayload.latitude,
            jsonPayload.longitude,
            jsonPayload.altitude || 0,
            flags,
            jsonPayload.posTimestamp
        );
    }
    else {
        // Caso: No hay datos de posición
        env.log("No se recibieron datos de ubicación, informando sin posición.");
        locationTracker.updateLocationTrackerStatus(
        0, // Latitud por defecto
        0, // Longitud por defecto
        0, // Altitud por defecto
        locationTrackerFlags.noPosition // Flag indicando que no hay posición
        //jsonPayload.timestamp // Usar el timestamp del mensaje
    );
}

    /*
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
    */
    // Parsear y almacenar la temperatura
    // FN 21-03-22: se debe usar el posTimestamp para que la temperatura registrada corresponda al recorrido real del camión
    //
    if (jsonPayload.temperature != null) {
        var temperatureSensor = device.endpoints.byAddress(2);
        if (jsonPayload.temperature < 100 && jsonPayload.temperature !== 0 && jsonPayload.temperature > -25){
        //temperatureSensor.updateTemperatureSensorStatus(jsonPayload.temperature, jsonPayload.timestamp);
        temperatureSensor.updateTemperatureSensorStatus(jsonPayload.temperature,jsonPayload.posTimestamp);
        }
        else{
        env.log("Temperatura fuera del rango operacional  ",jsonPayload.temperature);    
        }
    }

    // Parsear y almacenar firmware
    if (jsonPayload.fw != undefined && jsonPayload.fw != null) {
        const fw = jsonPayload.fw;
        env.log("fw --> ",fw)
        let cortar = fw.split('-');
        let aux = cortar[0];
        let aux1=cortar[1];
        let aux2 = aux.concat(".",aux1);  
        let text = aux2.toString();     
        device.updateDeviceFirmwareVersion(text);
        env.log("text ",text);
    }
 
}

function buildDownlink(device, endpoint, command, payload)
{
    payload.setAsString(command.custom.data);
    payload.requiresResponse = false;
	payload.buildResult = downlinkBuildResult.ok;
    return;
}