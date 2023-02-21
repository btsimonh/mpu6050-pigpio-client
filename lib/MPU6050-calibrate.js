

let proc = require('process');

function addCalibrate(MPU6050Inst) {

    MPU6050Inst.HW_OFFSET_ACC_MULTIPLE = 2048;
    MPU6050Inst.HW_OFFSET_GYRO_DPS_MULTIPLE = 32.8;


    //MPU6050Inst.HW_SCALE_LSB = 0.0156; // empirical
    MPU6050Inst.HW_SCALE_LSB = 0.01563; // better empirical?

    // adjust Accelleration hardware scale factor.
    // suggest you oonly do this if you really know what you are doing...
    // I found that the top 4 bits affect scale...  but that bit 7 was inverted.
    // Scales seem to be ~1-1.25 - so 16 steps of ~0.0156
    MPU6050Inst.setHWscales = async function (opts){
        let acc = opts.acc || [0, 0, 0];
        acc = acc.slice();
        for (let i = 0; i < 3; i++) {
            acc[i] = acc[i] - 1;
            acc[i] = acc[i]/this.HW_SCALE_LSB;  
            if (acc[i] < 0) acc[i] = 0;
            if (acc[i] > 15) acc[i] = 15;
            acc[i] = acc[i] ^ 8;
            acc[i] <<= 4;
            let org = await this.readByteData(this.REG_X_FINE_GAIN + i);
            org &= 0xf;
            org |= acc[i]; 
            await this.writeByteData(this.REG_X_FINE_GAIN + i, org);
        }
    };

    MPU6050Inst.getHWscales = async function (opts){
        let acc = [];
        let gyro = [1,1,1];
        for (let i = 0; i < 3; i++) {
            let org = await this.readByteData(this.REG_X_FINE_GAIN + i);
            org = (org >> 4) & 0xf;
            org = org ^ 8;
            let scale = org * this.HW_SCALE_LSB;
            acc.push(scale + 1);
        }
        return {acc, gyro};
    };

    // set hardware offset values in g and dps
    MPU6050Inst.setHWOffsets = async function (opts){
        let acc = opts.acc || [0, 0, 0];
        let gyro = opts.gyro || [0, 0, 0];
    
        // copy, so we don't modify the originals.
        acc = acc.slice();
        gyro = gyro.slice();

        if (0){
            // seems you can only set them with some jiggery.
            let prev = 1 << 7;                                                                         /* reset the device */
            await this.writeByteData(this.REG_PWR_MGMT_1, prev);                   /* write pwr mgmt 1 */
            await this.wait_ms(100);
            prev = await this.readByteData(this.REG_PWR_MGMT_1);
            prev &= ~(1 << 6);                                                                     /* clear config */
            await this.writeByteData(this.REG_PWR_MGMT_1, prev);                   /* write pwr mgmt 1 */
        }

        for (let i = 0; i < 3; i++) {
            // scale from g and dps to the values we need 
            // in the hardware offsets register
            acc[i] = (Math.round(acc[i] * this.HW_OFFSET_ACC_MULTIPLE) & 0xfffe);
            gyro[i] = Math.round(gyro[i] * this.HW_OFFSET_GYRO_DPS_MULTIPLE) & 0xffff;
    
            let reg = this.REG_XA_OFFSET_H + (i * 2); // acc on this.  6500 is different.
            let org = await this.readWordDataBE(reg);
            let val = (org & 1) | (acc[i] & 0xfffe);
            await this.writeWordDataBE(reg, val);
            reg = this.REG_XG_OFFS_USRH + (i * 2); // gyro
            await this.writeWordDataBE(reg, gyro[i]);
        }
    }
    
    // read current hardware offsets in g and dps
    MPU6050Inst.getHWOffsets = async function() {
        let accraw = [0, 0, 0];
        let gyroraw = [0, 0, 0];
        let acc = [0, 0, 0];
        let gyro = [0, 0, 0];
    
        for (let i = 0; i < 3; i++) {
            let reg = this.REG_XA_OFFSET_H + (i * 2); // acc on this.  6500 is different.
            accraw[i] = await this.readWordDataBE(reg);
            accraw[i] = accraw[i] & 0xfffe;
            if (accraw[i] >= 32768) accraw[i] -= 65536;
    
            reg = this.REG_XG_OFFS_USRH + (i * 2); // gyro
            gyroraw[i] = await this.readWordDataBE(reg);
            if (gyroraw[i] >= 32768) gyroraw[i] -= 65536;
    
            // scale from g and dps to the values we need 
            // in the hardware offsets register
            acc[i] = accraw[i] / this.HW_OFFSET_ACC_MULTIPLE;
            gyro[i] = gyroraw[i] / this.HW_OFFSET_GYRO_DPS_MULTIPLE;
        }
    
        return {acc, gyro};
    }


    // get avg values by reading fifo until we have more than 'packets'
    // note: data includes gravity.
    // if accRange and gyroRange are unset (undefined), then 2g/250dps will be used (recommended)
    // set hw_test_enable to enable hw test offset.
    MPU6050Inst.get_avg_values = async function( packets, hw_test_enable, accRange, gyroRange ) {
        packets = packets || 500;
        let loops = 1;

        console.log('averaging over '+packets+' packets');

        let power = 0x100;
        await this.writeWordDataBE(this.REG_PWR_MGMT_1, power);
        await this.wait_ms(20);                                                                          /* delay 200ms */
        
        await this.set_sample_rate(50);

        await this.writeByteData(this.REG_INT_ENABLE, 0);
        await this.writeByteData(this.REG_FIFO_EN, 0);
        await this.writeByteData(this.REG_PWR_MGMT_1, 0);
        await this.writeByteData(this.REG_I2C_MST_CTRL, 0);
        await this.writeByteData(this.REG_USER_CTRL, 0);
        let ctrl = 1 << 3 | 1 << 2;                                                                      /* set fifo and dmp reset */
        await this.writeByteData(this.REG_USER_CTRL, ctrl);
        await this.wait_ms(15);                                                                          /* delay 15ms */
        await this.writeByteData(this.REG_CONFIG, 1);
        await this.set_low_pass_filter(this.LOW_PASS_FILTER_1);
        await this.set_sample_rate_divider(0); // must use this function, as it sets some globals
        
        // if specific range not asked for, use most sensitive.
        // we need to be able to specify range, because if the HW accelleration bias is cleared,
        // it could be >2g offset, so we may ask for 16g, for example;
        accRange = (accRange !== undefined) ? accRange : this.ACCELEROMETER_RANGE_2G;
        gyroRange = (gyroRange !== undefined) ? gyroRange : this.GYROSCOPE_RANGE_250DPS;
    
        let gcfg = (gyroRange<<3); // try 2000dps
        if (hw_test_enable)                                                                        /* if enable */ {
            gcfg = 0xE0;                                                                      /* set 250dps and test */
        }
        this.gyroScale = this.RANGE_TO_GYRO_MULT[gyroRange];
        let gyroFs = this.RANGE_TO_GYRO_FS[gyroRange];
        await this.writeByteData(this.REG_GYRO_CONFIG, gcfg);

        let acfg = (accRange << 3); // 2g?
        if (hw_test_enable)                                                                        /* if enable */ {
            acfg = 0xE0;                                                                      /* enable 2g and test */
        }
        this.accScale = this.RANGE_TO_ACC_MULT[accRange];
        let accFs = this.RANGE_TO_ACC_FS[accRange];
        await this.writeByteData(this.REG_ACCEL_CONFIG, acfg);
        if (hw_test_enable)                                                                        /* if enable */ {
            // allow for MEMS stuff to move to hw test posn?
            await this.wait_ms(200);                                                                          /* delay 200ms */
        }
        
        ctrl = 1 << 6;                                                                               /* enable fifo */
        await this.writeByteData(this.REG_USER_CTRL, ctrl);
        await this.set_reg_bit(this.REG_INT_STATUS, this.INTERRUPT_FIFO_OVERFLOW, 0);

        this.fifo_temperature = false;
        this.fifo_acc = true;
        this.fifo_gyro = true;

        let totalPackets = 0;
        // offset accumulators
        let accel_offset = [0,0,0];                                                   /* accel offset 0 */
        let gyro_offset = [0,0,0];                                                     /* gyro offset 0 */

        // setup what we want to receive in fifo.
        // it is important to call the functions, because they set flags
        // which .read_fifo uses
        let enable_xyz = 0x78; /* enable xyz */
        await this.set_fifo_enable_reg(enable_xyz)
        // ensure no i2c data will arrive in fifo
        await this.set_iic_fifo_enable(0, 0);
        await this.set_iic_fifo_enable(1, 0);
        await this.set_iic_fifo_enable(2, 0);
        await this.set_iic_fifo_enable(3, 0);
        await this.set_iic_fifo_enable(4, 0);

        // start empty
        await this.fifo_reset(); // quick one
        await this.set_fifo(1);

        for (let i = 0; i < loops; i++){
            // we're configured for rather fast data here...
            // so enable, wait , disable, and THEN read, to avoid overflow.
            // 50ms -> ~600/1240 bytes - about as much as we should try from nodejs...
            await this.set_fifo_enable_reg(enable_xyz);
                ///////////////////////////////////
            // wait for 40ms worth of packts
            await this.wait_ms(40);                                                                          /* delay 50ms */
            ///////////////////////////////////
            // disable fifo...
            //await this.set_fifo_enable_reg(0); // can't call this, else the read fn does not know what to read....
            await this.writeByteData(this.REG_FIFO_EN, 0);

            // read the data we captured to the fifo
            let out = await this.read_fifo();

            if (out.overflow){
                console.log('fifo overflow - retry');
                loops++;
            } else {
                let pack_cnt = out.packets.length;
                for (let p = 0; p < pack_cnt; p++)                                                                  /* packet counter */ {
                    let pkt = out.packets[p];
                    for (let a = 0; a < 3; a++){
                        accel_offset[a] += pkt.accel_g[a];                                                   /* accel offset 0 */
                        gyro_offset[a] += pkt.gyro_dps[a];                                                     /* gyro offset 0 */
                    }
                    //console.log(JSON.stringify(pkt));
                }
                totalPackets += pack_cnt;
            }

            proc.stdout.write('\raveraging...'+totalPackets+'/'+packets+'         ');
            if (totalPackets < packets){
                loops++;
            }
        }

        for (let i = 0; i < 3; i++){
            accel_offset[i] /= totalPackets;                                                   /* accel offset 0 */
            gyro_offset[i] /= totalPackets;                                                     /* gyro offset 0 */
        }

        return {
            acc: accel_offset, gyro: gyro_offset, gyroFs, accFs,totalPackets
        };                                                                                       /* success return 0 */
    }
    
    MPU6050Inst.get_hw_scales = async function( packets ) {
        let org_offsets = await this.getHWOffsets();
        let org_values = await this.get_avg_values(packets);
        //console.log('org values', org_values);

        // values we will add to the offsets to
        // measure the scale.
        let test = { 
            acc: [0.5, 0.5, 0.5], // in g before hw scale
            gyro: [100, 100, 100], // in dps before hardware scale
        };

        let mod = {
            acc:[],
            gyro:[],
        }

        for (let i = 0; i < 3; i++) {
            mod.acc.push(org_offsets.acc[i] - test.acc[i]);
            mod.gyro.push(org_offsets.gyro[i] - test.gyro[i]);
        }

        // set the modified offsets
        await this.setHWOffsets(mod);
        // re-read the average values
        let mod_values = await this.get_avg_values(packets);
        await this.setHWOffsets(org_offsets);

        let scale = {
            acc:[],
            gyro:[],
        };

        // calculate how much the avg values changed by - and hence the hardware scaling.
        for (let i = 0; i < 3; i++) {
            scale.acc.push((org_values.acc[i] - mod_values.acc[i]) / test.acc[i]);
            scale.gyro.push((org_values.gyro[i] - mod_values.gyro[i]) / test.gyro[i]);
        }

        return {
            offsets: org_offsets, // {acc, gyro}
            scale: scale, // {acc, gyro}
            curr_bias: org_values, // {acc, gyro}
        };
    };
    

    MPU6050Inst.calc_new_hw_offsets = function( hw_values ) {
        hw_values.new_offsets = {acc: [], gyro: [] };
        for (let i = 0; i < 3; i++) {
            hw_values.new_offsets.acc.push( 
                hw_values.offsets.acc[i] - 
                (hw_values.curr_bias.acc[i]/hw_values.scale.acc[i]));

            hw_values.new_offsets.gyro.push( 
                hw_values.offsets.gyro[i] - 
                (hw_values.curr_bias.gyro[i]/hw_values.scale.gyro[i]));
        }
        return hw_values;
    }



    // pure test function I used to get the empirical hardware scale LSB
    MPU6050Inst.testScale = async function() {
        let reg = MPU6050.REG_X_FINE_GAIN;
        let axis = 0;

        let g = 0 ^ 8;
        await MPU6050.writeByteData(reg, (g<<4));
        let incracc = 0;
        let num = 1;
        for (let i = 0; i < num; i++){
            let hw_values = await MPU6050.get_hw_scales(5000);
            incracc += hw_values.scale.acc[axis];
            console.log(i+'/'+num);
        }
        incracc /= num;
        let scale0 = incracc;
        console.log('scale at 0:'+ incracc);

        g = 15 ^ 8;
        await MPU6050.writeByteData(reg, (g<<4));
        incracc = 0;
        for (let i = 0; i < num; i++){
            let hw_values = await MPU6050.get_hw_scales(5000);
            incracc += hw_values.scale.acc[axis];
            console.log(i+'/'+num);
        }
        incracc /= num;
        console.log('scale at 15:'+ incracc);
        let scale15 = incracc;

        let scaleincr = (scale15 - scale0)/15;

        console.log('scaleincr:'+scaleincr);
    }


}

module.exports = addCalibrate;