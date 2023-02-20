//////////////////////////////////////////////////////////////////////////////////
// Example covering all aspects of reading and claibrating the MPU6050
//
// Usage:
// node MPU6050-test.js <op>? <host>?
// op = calibrate|poll|fifo|dmp|csv - defaults to dmp
// host = ip or domain name where pigpio is exposing port 8888 - defaults to 127.0.0.1, 
// e.g. from the examples folder:
// node MPU6050-test.js poll 192.168.1.185
//
//////////////////////////////////////////////////////////////////////////////////

let host = '127.0.0.1';

let proc = require('process');
let fs_promises = require('fs').promises;
let fs = require('fs');
// this must be the branch modified to include i2c
// https://github.com/btsimonh/pigpio-client/tree/Addmorei2c
const pigpioClient = require('pigpio-client');
let getMPU6050 = require('../index.js');
//let getMPU6050 = require('mpu6050-pigpio-client');

// comment out to stop debug
//proc.env['DEBUG'] = 'pigpio';
//proc.env['PIGPIO'] = '1';

// simple ansi screen stuff.
let CLS =  '\033[2J';
let BLUE="\033[0;34m";
let RED="\033[0;31m";
let LIGHT_RED="\033[1;31m";
let WHITE="\033[1;37m";
let NO_COLOUR="\033[0m";

let op = 'dmp';

// set to 1 for display of avg values at start.
let debug = 0;
//let op = 'fifo';
//let op = 'poll';
//let op = 'calibrate';
//let op = 'csv';


// expect to be called like:
// node MPU6050-test.js <op>? <host>?
// op = calibrate|poll|fifo|dmp|csv - defaults to dmp
// host = ip or domain name where pigpio is exposing port 8888 - defaults to 127.0.0.1, 
// e.g.
// node MPU6050-test.js poll 192.168.1.185
//
const args = process.argv;
if (args.length > 2) op = args[2]; 
if (args.length > 3) host = args[3];

// note, each time op === 'calibrate', the latest calibration is added tot he start of the calibration array.
// this allows you to look at the calibration data - e.g. if you calibrate at different orientations - and compare.
// also, op === 'csv' will make the calibraiton data as a .csv file for easy viewing.
let calibrationDataFile = 'calibration.json';
let calibrationData;
try {
    let data = fs.readFileSync(calibrationDataFile);
    calibrationData = JSON.parse(data);
} catch(e) {
    console.error(e);
    if (op !== 'calibrate'){
        console.error('No Calibration data available - \nPlease run "node MPU6050-test.js calibrate <host>" first');
        return -1;
    }
}

if (op === 'calibrate'){
    //in calibrationData, it's useful tot see it all...
    dbeug = 1;
}


// this op writes the calibration data array as a csv file for easy viewing, and leaves
if (op === 'csv'){
    let csv = '';
    for (let i = 0; i < d.length; i++){
        let p = calibrationData[i];
        csv += `${p.orient},`
        csv += `${p.bias.acc[0].toFixed(3)},${p.bias.acc[1].toFixed(3)},${p.bias.acc[2].toFixed(3)},`;
        csv += `${p.bias.gyro[0].toFixed(3)},${p.bias.gyro[1].toFixed(3)},${p.bias.gyro[2].toFixed(3)}`;
        csv += '\n';
    }
    fs.writeFileSync(calibrationDataFile+'.csv', csv);
    return;
}


// Connect to the Rpi...
console.log('trying to connect to '+host);

let opts = {
    host: host, // the host it will try to connect to port 8888 on....
    //port: 8888, // default is 8888
    timeout: 3, // retry timer in s?
};

let pigpio = pigpioClient.pigpio(opts);  

const ready = new Promise((resolve, reject) => {
    pigpio.once('connected', resolve);
    pigpio.once('error', reject);
});
  
ready.then(async (info) => {
    // display information on pigpio and connection status
    //console.log(JSON.stringify(info,null,2));
    let MPU6050 = await getMPU6050(pigpio);

    let useCLS = false;
    //let useCLS = true;


    await MPU6050.init();
    await MPU6050.init_defaults();

    // settling time
    // settling time - waiting for a read
    await MPU6050.wait_ms(300);
    if (debug) console.log('manual reg read at init:', await MPU6050.read());

    if (op === 'calibrate'){
        calibrationData = await calibrate_fn(MPU6050, calibrationData);
    }

    // use the last calibrationData[0]
    // NOTE: gyro calibraiton is significanlty different depending on calibration orientation.
    // so I'm just going to set zeros here if using the dmp
    // as it will auto-calibrate the gyro.
    let hw_offsets = {acc:calibrationData[0].offsets.acc, gyro:calibrationData[0].offsets.gyro};
    if (op === 'dmp'){
        hw_offsets.gyro = [0,0,0];
    }
    await MPU6050.setHWOffsets(hw_offsets);

    await MPU6050.set_sample_rate(200);
    await MPU6050.wait_ms(100);
    if (debug) console.log('manual reg read after calibrate:', await MPU6050.read());
    if (debug) console.log('Avg after calibrate:', await MPU6050.get_avg_values());
    if (debug) console.log('Longer Avg after calibrate:', await MPU6050.get_avg_values(undefined, undefined, 2000));
    // note: get_avg_values() sets the sample rate...
    await MPU6050.set_sample_rate(200);

    if (op === 'poll'){
        // simple read values every 100ms.
        // this reads a block from the registers in one hit.
        // I cannot guarantee that the MPU6050 will not write data at exactly the same time, so
        // the values ay not be reliable.
        while (1){
            await MPU6050.wait_ms(100);
            let data = await MPU6050.read();
            console.log(WHITE);
            if (useCLS) console.log(CLS);
            // print the latest packet
            printPacket(data);
        }
    }

    if (op === 'fifo'){
        // enable what we want from the fifo.
        await MPU6050.set_fifo(0);

        // using these functions sets flags in variable MPU6050.fifo_enable
        // which enables read_fifo to decide what to read....
        await MPU6050.set_fifo_enable(MPU6050.FIFO_ACCEL, 1);
        await MPU6050.set_fifo_enable(MPU6050.FIFO_TEMP, 1);
        await MPU6050.set_fifo_enable_gyro(1);

        // just to prove we can get data from the extenral regs.
        // I have not tested actually having i2c slave(s).
        await MPU6050.set_iic_transferred_len(0, 2); // stes the len we expect in the fifo if enabled.
        await MPU6050.set_iic_transferred_len(1, 3);
        await MPU6050.set_iic_transferred_len(2, 5);
        await MPU6050.set_iic_transferred_len(3, 6);
        await MPU6050.set_iic_fifo_enable(0, 0);
        await MPU6050.set_iic_fifo_enable(1, 1); // example of picking up some i2c data - not tested with real data.
        await MPU6050.set_iic_fifo_enable(2, 1);
        await MPU6050.set_iic_fifo_enable(4, 0);

        // for reading fifo, we need a lower sample rate, else we'll get too much data
        let rate = await MPU6050.set_sample_rate(10);

        // overall fifo disable
        await MPU6050.set_fifo(0);

        // clean the fifo
        await MPU6050.reset_fifo();

        // start reading data into the fifo
        await MPU6050.set_fifo(1);

        // read values from the fifo.
        // as long as the fifo does not overflow (in which case we'll reset the fifo)
        // data should be good all the time.
        while(1){
            await MPU6050.wait_ms(20);
            // if the fifo overflows, .read_fifo will reset it.
            let out = await MPU6050.read_fifo();
            if (out.packets.length){
                console.log(WHITE);
                if (useCLS) console.log(CLS);
                console.log('packets:'+out.packets.length);
                // print the latest packet
                printPacket(out.packets[out.packets.length-1]);
                console.log('Sample Rate is '+rate+' hz');
            }
        }
    }

    if (op === 'dmp'){
        await MPU6050.dmp_defaults();
        // be sure to set the main sample rate before dmp setup.
        // a lot of the timing functions depend upon use knowing the correct rate..
        let rate = await MPU6050.set_sample_rate(200);

        // for 'normal' dmp use, set sample_rate to 200 - you want it to read and integrate as fast as it can.
        // It becomes more difficult if you want i2c data as well, as you may need the dmp rate and sample rate to match,
        // else the fifo packet size may not be constant?

        // dmp functions which modify the firmware can be called before or after the firmware is loaded.
        // if called before, a shadow copy fo the firmware is made, and modified.  This is more time/network efficient, 
        // but has a > 3k memory load.
        await MPU6050.dmp_loaded_defaults();
        await MPU6050.dmp_set_accel_bias([0,0,0]);
        await MPU6050.dmp_set_gyro_bias([0,0,0]);

        await MPU6050.dmp_load_firmware();

        await MPU6050.dmp_set_feature(
            MPU6050.DMP_FEATURE_6X_QUAT |
            MPU6050.DMP_FEATURE_TAP |         // optional
            MPU6050.DMP_FEATURE_PEDOMETER |   // optional
            MPU6050.DMP_FEATURE_ORIENT |      // optional
            MPU6050.DMP_FEATURE_SEND_RAW_ACCEL | // optional
            MPU6050.DMP_FEATURE_SEND_CAL_GYRO | // optional
            MPU6050.DMP_FEATURE_GYRO_CAL |
            0
        );

        // can we do this?
        // hmmm...  no.  they add into the fifo independently
        // at a different rate to the dmp - so not possible to track the data.
        await MPU6050.set_iic_transferred_len(0, 1);
        await MPU6050.set_iic_transferred_len(1, 3);
        await MPU6050.set_iic_transferred_len(2, 5);
        await MPU6050.set_iic_transferred_len(3, 6);
        await MPU6050.set_iic_fifo_enable(0, 0);
        await MPU6050.set_iic_fifo_enable(1, 0);
        await MPU6050.set_iic_fifo_enable(2, 0);
        await MPU6050.set_iic_fifo_enable(4, 0);

        let dmprate = await MPU6050.dmp_set_fifo_rate(5);
        console.log('Sample Rate is '+rate+' hz, dmp rate is '+dmprate+' hz');

        // clear screen, move to 0,0
        if (useCLS) console.log(CLS);

        // set to enable monitoring of DMP memory
        let memdump = false;
        if (memdump){
            let lastmem = await MPU6050.dmp_read_mem(0, 0x400);
        }

        let start = 0;
        let startCount = 0;
        await MPU6050.dmp_set_enable(1);


        await MPU6050.set_fifo(0);
        await MPU6050.fifo_reset(); // quick one?
        await MPU6050.set_fifo(1);

        // read values from the fifo.
        // as long as the fifo does not overflow (in which case we'll reset the fifo)
        // data should be good all the time.
        // the dmp should be averaging the gyro values for us - i.e. over (dmp_rate/sample_rate) samples
        while(1){
            let out = await MPU6050.dmp_read();
            if (out.packets.length){
                let now = (new Date()).valueOf();
                let dur = now - start;
                //console.log(CLS);

                //Position the Cursor: \033[<L>;<C>H or \033[<L>;<C>f (puts the cursor at line L and column C)
                // cursor to top
                console.log(WHITE);
                if (memdump){
                    console.log('\033[0;0H'+WHITE);
                    let mem = await MPU6050.dmp_read_mem(0, 0x400);
                    console.log(memdiff(0, lastmem, mem));
                    lastmem = mem;
                } else {
                    if (useCLS) console.log(CLS);
                }
                console.log('packets:'+out.packets.length);
                // print the latest packet
                printPacket(out.packets[out.packets.length-1]);
                console.log('Sample Rate is '+rate+' hz, dmp rate is '+dmprate+' hz');
                if (start) console.log('Sample interval? '+(dur / (out.sample_count_at_read - startCount)).toFixed(1));
                console.log('Sample Count '+out.sample_count_at_read);
                if (!start){
                    start = (new Date()).valueOf();
                    startCount = out.sample_count_at_read;
                }
            }
            await MPU6050.wait_ms(20);
        }
    }


    await MPU6050.deinit();
    await MPU6050.close();

    let res = await pigpio.end();
})
.catch((e)=>{
    console.error(e);
});


async function calibrate_fn(MPU6050, calibrationData) {
    // get avg over > 5000 packets
    let avg = await MPU6050.get_avg_values(undefined, undefined, 5000);
    console.log('Avg before calibrate:', await MPU6050.get_avg_values());

    let factory_offsets = await MPU6050.getHWOffsets();
    console.log('factory hardware offsets:', factory_offsets);

    let hw_scale = await MPU6050.getHWscales();
    console.log('factory hardware scaling:', hw_scale);

    let calib = {
        offsets: factory_offsets,
        curr_bias: avg,
        scale: hw_scale,
    };

    // keep it before accel mods, so we known which way we are facing for the file.....
    let bias_org = JSON.parse(JSON.stringify(calib.curr_bias));
    // account for gravity - find the axis with gravity and remove it from the current bias.
    let axis = ['X', 'Y', 'Z'];
    let orient;
    for (let i = 0; i < 3; i++){
        if (calib.curr_bias.acc[i] > 0.6){
            calib.curr_bias.acc[i] -= 1;
            orient = axis[i]+'up';
            break;
        }
        if (calib.curr_bias.acc[i] < -0.6){
            calib.curr_bias.acc[i] += 1;
            orient = axis[i]+'down';
            break;
        }
    }
    // add new_offsets to calib, based on currnet_bias and scale
    calib = MPU6050.calc_new_hw_offsets(calib);
    await MPU6050.setHWOffsets(calib.new_offsets);

    if (!calibrationData){
        calibrationData = [];
    }
    // add latest calibration data to the start
    calibrationData.unshift({orient, offsets: calib.new_offsets, bias: bias_org });

    try {
        await fs_promises.writeFile(calibrationDataFile, JSON.stringify(calibrationData, null, ' '));
    } catch(e){
        console.error(e);
    }
    return calibrationData;
}


// displays the difference between two arrays as a coloured dump
function memdiff(addr, mlast, mcurr){
    let len = mlast.length;
    let width = 32;
    let offs = (addr % width);
    let txt = '';
    for (let i = addr - offs; i < addr+len; i += width) {
        txt += '\n' + ('000' + i.toString(16)).slice(-4) + ': ';
        for (let j = i; j < i + width && j < addr+len; j++) {
            if (j < offs){
                txt += ('   ');
            } else {
                if (mcurr[j-addr] !==  mlast[j-addr]){
                    txt += RED;
                } else {
                    txt += WHITE; 
                }
                txt += ('0' + mcurr[j-addr].toString(16)).slice(-2) + ' ';
                if (mcurr[j-addr] !==  mlast[j-addr]){
                    txt += WHITE;
                }
            }
        }
    }
    txt += WHITE;
    return txt;
}


// prints a dmp, fifo, or raw read packet
function printPacket(p){
    //console.log(JSON.stringify(p));
    
    /*{"pkt_sample_num":14386,"pkt_ms":71930,
    "pitch":-0.02010638360795841,"roll":0.5220586412917062,"yaw":1.124392738843851,
    "q":[0.9999415352940559,0.004551556892693043,-0.0002200184389948845,-0.009806145913898945],
    "gesture":{"orient":0,"tap":50}}}}}}}
    */
    if (p.pkt_sample_num !== undefined){
        console.log(
            'Sample:'+('        '+p.pkt_sample_num).slice(-8)+' '+
            'ms:'+('        '+p.pkt_ms).slice(-8)+' ');
    }

    if (p.pitch !== undefined){
        console.log(
            'Pitch:'+('        '+p.pitch.toFixed(1)).slice(-8)+' '+
            'Roll:'+('        '+p.roll.toFixed(1)).slice(-8)+' '+
            'Yaw:'+('        '+p.yaw.toFixed(1)).slice(-8)+' ');
    }
    if (p.q !== undefined){
        let txt = 'Q:';
        for (let i = 0; i < p.q.length; i++){
            txt += ('        '+p.q[i].toFixed(6)).slice(-8)+' ';
        }
        console.log(txt);
    }
    if (p.accel_g !== undefined){
        let txt = 'acc_g:(';
        for (let i = 0; i < p.accel_g.length; i++){
            txt += ('        '+p.accel_g[i].toFixed(3)).slice(-8)+' ';
        }
        txt += ')';
        console.log(txt);
    }
    if (p.gyro_dps !== undefined){
        let txt = 'gyro_dps:(';
        for (let i = 0; i < p.gyro_dps.length; i++){
            txt += ('        '+p.gyro_dps[i].toFixed(3)).slice(-8)+' ';
        }
        txt += ')';
        console.log(txt);
    }
    if (p.tempdegrees){
        console.log('Temp: '+p.tempdegrees.toFixed(1)+'C');
    }
    if (p.i2c !== undefined){
        let names = Object.keys(p.i2c);
        for (let i = 0; i < names.length; i++){
            txt = '';
            let i2c = p.i2c[names[i]];
            txt += names[i]+':';
            for (let j = 0; j < i2c.length; j++){
                txt += ('0'+i2c[j].toString(16)).slice(-2) +' ';
            }
            console.log(txt);
        }
    }

};
