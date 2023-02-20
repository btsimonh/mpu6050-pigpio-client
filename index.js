///////////////////////////////////////////////////////////////////////
// Supplied with a pigpio-client instance, this module opens the i2c
// and then adds the MPU6050 functions and data to that i2c instance.
///////////////////////////////////////////////////////////////////////


let addConstants = require('./lib/MPU6050-constants.js');
let addDMPConstants = require('./lib/MPU6050-dmp-constants.js');
let addBase = require('./lib/MPU6050-base.js');
let addDMPfns = require('./lib/MPU6050-dmp.js');
let addCalibrate = require('./lib/MPU6050-calibrate.js');

const I2C_BUS = 1;
const DEFAULT_MPU6050_ADDR = 0x68;

let getMPU6050 = async function(pigpio, opts){
    if (!pigpio){
        console.error('connected pigpio instance required');
        return;
    }

    opts = opts || {};
    let bus = opts.bus || I2C_BUS;
    let addr = opts.addr || DEFAULT_MPU6050_ADDR;

    let MPU6050Inst = await pigpio.i2c(bus, addr);
    addConstants(MPU6050Inst);
    addDMPConstants(MPU6050Inst);
    addBase(MPU6050Inst);
    addDMPfns(MPU6050Inst);
    addCalibrate(MPU6050Inst);

    return MPU6050Inst;
}

module.exports = getMPU6050;
